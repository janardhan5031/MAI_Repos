import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ConfigurationService } from "src/common/config/config.service";
import {
  ERROR_MESSAGES,
  EventStatus,
  ROLES,
  SUCCESS_MESSAGE,
} from "src/common/config/constants";
import { Artist } from "src/common/database/entities/artist.entity";
import { Event } from "src/common/database/entities/events.entity";
import { Ownership } from "src/common/database/entities/meta/ownership.entity";
import { KafkaService } from "src/common/kafka/kafka.service";
import { LoggingService } from "src/common/logging/logging.service";
import { AuthEngine } from "src/common/services/auth_engine";
import { ErrorService } from "src/common/services/errorService";
const AWS = require("aws-sdk");
const { ObjectId } = require("mongodb");

@Injectable()
export class AvatarService {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly errorService: ErrorService,
    private readonly ConfigService: ConfigurationService,
    private readonly KafkaService: KafkaService,
    private readonly authEngine: AuthEngine,
    @InjectModel(Artist.name)
    private readonly ArtistModel: Model<Artist>,
    @InjectModel(Ownership.name)
    private readonly OwnershipModel: Model<Ownership>,
    @InjectModel(Event.name)
    private readonly EventModel: Model<Event>
  ) {}

  async eventCustomAvatar(
    loginResponse: any,
    customAvatarUrl: String,
    eventId: String
  ) {
    try {
      if (!["EVENT_ARTIST"].includes(loginResponse.roles[0])) {
        this.errorService.error({ message: ERROR_MESSAGES.INVALID_ROLE }, 400);
      }

      // validate the event which is exist or not
      const [validEvent] = await this.EventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            isDeleted: false,
          },
        },
      ]);

      if (
        !validEvent ||
        (validEvent && validEvent.eventStatus == EventStatus.COMPLETED)
      ) {
        this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_EVENT_ID },
          400
        );
        return;
      } else if (validEvent.eventStatus) {
        this.errorService.error(
          { message: ERROR_MESSAGES.ADDING_DETAILS_AFTER_SALE_START },
          400
        );
        return;
      }

      const eventOwner = await this.OwnershipModel.aggregate([
        {
          $match: {
            ownerId: new ObjectId(loginResponse.artistId),
            event: new ObjectId(eventId),
            isDeleted: false,
          },
        },
      ]);

      if (!eventOwner.length) {
        this.errorService.error(
          { message: ERROR_MESSAGES.NO_EVENT_OWNER },
          400
        );
      }

      const key = customAvatarUrl.split("/").pop();
      let isCustomAvatar = false;

      const s3 = new AWS.S3({
        signatureVersion: "v4",
        accessKeyId: this.ConfigService.get("ACCESS_KEY"),
        secretAccessKey: this.ConfigService.get("SECRET_ACCESS_KEY"),
        region: this.ConfigService.get("AVATAR_BUCKET_REGION"),
      });
      const params = {
        Bucket: this.ConfigService.get("AVATAR_BUCKET_NAME"),
        Key: key,
      };

      // check the object found in s3 bucket
      const avatarData: any = await new Promise((resolve, reject) => {
        s3.headObject(params, async (error, data) => {
          if (error) {
            if (error.code === "NotFound") {
              this.loggingService.log(`Avatar with ${key} not found in S3`);
              try {
                // check the avatar come from sdk
                const file: any = await this.authEngine.fetchFileFromUrl(
                  customAvatarUrl
                );

                // check if the avatar url is valid by fetching its fileName of its data
                if (!Object.keys(file)?.length) {
                  reject(new Error(ERROR_MESSAGES.AVATAR_NOT_FOUND));
                }
                resolve(true);
              } catch (error) {
                // if the avatar url is not valid
                reject(new Error(ERROR_MESSAGES.AVATAR_NOT_FOUND));
              }
            } else {
              // for any issue caused while fetchind object in s3
              this.loggingService.error("ERROR_WHILE_FETCHING_AVATAR", error);
              reject(new Error(ERROR_MESSAGES.SOMETHING_WENT_WRONG));
            }
          } else {
            this.loggingService.log(`Successfully fetched avatar with ${key}`);

            // if the avatar is custom and uploaded to avatar service, check userId in its metaData
            if (data?.Metadata?._id != loginResponse._id) {
              reject(new Error(ERROR_MESSAGES.INVALID_AVATAR));
            }
            resolve(data);
            isCustomAvatar = true;
          }
        });
      });

      // update Ownership model
      const updatedOwnershipDetails: any =
        await this.OwnershipModel.findOneAndUpdate(
          {
            ownerId: new ObjectId(loginResponse.artistId),
            event: new ObjectId(eventId),
            isDeleted: false,
          },
          {
            $addToSet: { progress: { $each: ["CUSTOM_AVATAR"] } },
            customAvatar: {
              Url: customAvatarUrl,
              isCustomAvatar: isCustomAvatar,
            },
          },
          { new: true }
        );

      this.KafkaService.sendMessage(
        this.ConfigService.getKafkaTopic("ADD_REMOVE_OWNERSHIP"),
        {
          isRemoved: false,
          result: updatedOwnershipDetails,
        }
      );

      return {
        isOk: true,
        message: SUCCESS_MESSAGE.UPDATE_CUSTOM_AVATAR,
      };
    } catch (error) {
      this.loggingService.error("ERROR_WHILE_UPDATING_CUSTOM_AVATAR", error);
      return error;
    }
  }

  async getEventAvatar(loginResponse: any, eventId: string) {
    try {
      const [response] = await this.OwnershipModel.aggregate([
        {
          $match: {
            ownerId: new ObjectId(loginResponse.artistId),
            event: new ObjectId(eventId),
            isDeleted: false,
          },
        },
        {
          $project: {
            eventId: "$event",
            Url: "$customAvatar.Url",
            isCustomAvatar: "$customAvatar.isCustomAvatar",
          },
        },
      ]);

      if (!response) {
        this.errorService.error(
          { message: ERROR_MESSAGES.OWNERSHIP_NOT_FOUND },
          400
        );
        return;
      }

      return response;
    } catch (error) {
      this.loggingService.error("ERROR_WHILE_FETCHING_CUSTOM_AVATAR", error);
      return error;
    }
  }
}
