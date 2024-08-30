import { Injectable } from "@nestjs/common";
import { Ownership } from "../database/entities/meta/ownership.entity";
import { KafkaService } from "../kafka/kafka.service";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { TimeConversionHelperService } from "../helper/timezone";
import { ErrorService } from "./errorService";
import { ConfigurationService } from "../config/config.service";
import * as moment from "moment";
import { NotificationEngine } from "./notification_engine";
import { ARTIST_PROGRESS, ROLES } from "../config/constants";
const { ObjectId } = require("mongodb");

@Injectable()
export class OnwershipService {
  constructor(
    private readonly errorService: ErrorService,
    private readonly config: ConfigurationService,
    private readonly timeConversionServer: TimeConversionHelperService,
    @InjectModel(Ownership.name)
    private readonly ownershipModel: Model<Ownership>,
    private readonly kafkaService: KafkaService,
    private readonly notificationEngine: NotificationEngine
  ) {}
  async addOwnership(data, userTimeZone) {
    try {
      const [ownership] = await this.ownershipModel.aggregate([
        {
          $match: {
            event: new ObjectId(data.event),
            ownerId: new ObjectId(data.ownerId),
            isDeleted: false,
          },
        },
      ]);

      const [ownershipAssets] = await this.ownershipModel.aggregate([
        {
          $match: {
            event: new ObjectId(data.event),
            type: data.type,
          },
        },
      ]);

      let owner;

      if (!ownership) {
        data.createdAt = new Date();
        data.assets = ownershipAssets?.assets || [];
        data.progress = [];
        data.orgProgress = ownershipAssets?.assets.length > 0 ? [ARTIST_PROGRESS.UPLOADBANNER] : [];
        owner = await new this.ownershipModel(data).save();

        if (!(owner.type === "EVENT_VENDOR")) {
          await this.sendEmailToOwner(owner); //send email to advertiser/artist.
        }
      } else {
        const updateParams = {
          updatedAt: new Date(),
          assets: ownershipAssets?.assets || [],
        };

        if (ownership.type === "EVENT_ARTIST") {
          updateParams["$push"] = { timeSlot: { $each: data.timeSlot } };
        }

        owner = await this.ownershipModel.findByIdAndUpdate(
          ownership._id,
          updateParams,
          { new: true }
        );
      }

      this.kafkaService.sendMessage(
        this.config.getKafkaTopic("ADD_REMOVE_OWNERSHIP"),
        {
          isRemoved: false,
          result: owner,
        }
      );

      return owner;
    } catch (error) {
      return this.errorService.error({ message: `${error}` }, 400);
    }
  }

  async sendEmailToOwner(owner) {
    const pipeline =
      owner.type === "EVENT_ARTIST"
        ? {
            $lookup: {
              from: "artists",
              localField: "ownerId",
              foreignField: "_id",
              as: "owner",
            },
          }
        : {
            $lookup: {
              from: "advertisers",
              localField: "ownerId",
              foreignField: "_id",
              as: "owner",
            },
          };
    const ownerData = await this.ownershipModel.aggregate([
      {
        $match: {
          _id: new ObjectId(owner._id),
          event: new ObjectId(owner.event),
        },
      },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event",
        },
      },
      pipeline,
      {
        $project: {
          name: 1,
          eventName: 1,
          "event.startDate": 1,
          "event.startTime": 1,
          "event.endTime": 1,
          "owner.email": 1,
        },
      },
    ]);

    const obj = {
      eventName: ownerData[0]?.eventName,
      startDate: moment
        .utc(ownerData[0]?.event[0]?.startDate)
        .format("YYYY-MM-DD"),
      startTime: ownerData[0]?.event[0]?.startTime,
      endTime: ownerData[0]?.event[0]?.endTime + " GMT",
    };

    if (owner.type === "EVENT_ARTIST") {
      this.notificationEngine.artistAddedToEvent(
        { userId: "artist", email: ownerData[0]?.owner[0]?.email },
        { ...obj, artistName: ownerData[0]?.name }
      );
    } else {
      this.notificationEngine.advertiserAddedToEvent(
        { userId: "advertiser", email: ownerData[0]?.owner[0]?.email },
        { ...obj, advertiserName: ownerData[0]?.name }
      );
    }
  }

  async addAssets(data, userTimeZone) {
    try {
      let ownership = await this.ownershipModel.findOne({
        event: new ObjectId(data.event),
        type: data.type,
      });
      if (!!ownership) {
        let updatedAt = new Date();
        await this.ownershipModel.findByIdAndUpdate(
          data.ownershipId,
          {
            assets: ownership.assets,
            updatedAt,
          },
          { new: true }
        );
        return true;
      }
      return false;
    } catch (error) {
      return this.errorService.error({ message: `${error}` }, 400);
    }
  }
  async deleteOwnership(data, userTimeZone) {
    try {
      let deletedAt =new Date()
      let ownership = await this.ownershipModel.findOne({
        event: new ObjectId(data.event),
        ownerId: new ObjectId(data.ownerId),
        isDeleted: false,
      });
      if (!!ownership) {
        let owner;
        if (ownership?.type ===ROLES.EVENT_ARTIST) {
          let updatedAt = new Date()
          owner = await this.ownershipModel.findByIdAndUpdate(
            ownership._id,
            {
              $pull: { timeSlot: data.timeSlot[0] },
              updatedAt,
            },
            { new: true }
          );
          if (owner && owner?.timeSlot?.length === 0) {
            owner = await this.ownershipModel.findByIdAndUpdate(
              ownership._id,
              {
                isDeleted: true,
                deletedAt,
              },
              { new: true }
            );
          }
        } else {
          owner = await this.ownershipModel.findByIdAndUpdate(
            ownership._id,
            {
              isDeleted: true,
              deletedAt,
            },
            { new: true }
          );
        }
        this.kafkaService.sendMessage(
          this.config.getKafkaTopic("ADD_REMOVE_OWNERSHIP"),
          {
            isRemoved: true,
            result: owner,
          }
        );
        return owner._id;
      }
      return null;
    } catch (error) {
      return this.errorService.error({ message: `${error}` }, 400);
    }
  }

  async deleteOwnershipsbyeventId(data, deletedAt, userTimeZone) {
    try {
      let ownership = await this.ownershipModel.aggregate([
        {
          $match: {
            event: new ObjectId(data.event),
            type: {
              $in: ["EVENT_ARTIST", "EVENT_ADVERTISER", "EVENT_ORGANIZER"],
            },
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "organizers",
            localField: "ownerId",
            foreignField: "_id",
            as: "organizer",
          },
        },
        {
          $lookup: {
            from: "advertisers",
            localField: "ownerId",
            foreignField: "_id",
            as: "advertisers",
          },
        },
        {
          $lookup: {
            from: "artists",
            localField: "ownerId",
            foreignField: "_id",
            as: "artists",
          },
        },
        {
          $project: {
            name: 1,
            type: 1,
            "organizer.email": 1,
            "organizer.name": 1,
            "advertisers.email": 1,
            "advertisers.name": 1,
            "artists.email": 1,
            "artists.name": 1,
          },
        },
      ]);
      if (ownership.length > 0) {
        let owner;
        this.sendEmailToAllUsers(ownership);
        owner = await this.ownershipModel.updateMany(
          { event: new ObjectId(data.event), isDeleted: false },
          {
            isDeleted: true,
            deletedAt,
          },
          { many: true }
        );

        return owner;
      }
      return null;
    } catch (error) {
      return this.errorService.error({ message: `${error}` }, 400);
    }
  }

  async getEmailsByType(owners, targetType) {
    const emails = owners
      .filter((owner) => owner.type === targetType)
      .map((owner) => {
        const { organizer = [], artists = [], advertisers = [] } = owner;
        const email = {
          EVENT_ORGANIZER: organizer.length ? organizer[0].email : "",
          EVENT_ARTIST: artists.length ? artists[0].email : "",
          EVENT_ADVERTISER: advertisers.length ? advertisers[0].email : "",
        }[targetType];
        const name = {
          EVENT_ORGANIZER: organizer.length ? organizer[0].name : "",
          EVENT_ARTIST: artists.length ? artists[0].name : "",
          EVENT_ADVERTISER: advertisers.length ? advertisers[0].name : "",
        }[targetType];

        return { email, name };
      });

    return emails;
  }

  async sendEmailToAllUsers(owner) {
    const emailTypes = ["EVENT_ORGANIZER", "EVENT_ARTIST", "EVENT_ADVERTISER"];

    for (const type of emailTypes) {
      const emails = await this.getEmailsByType(owner, type);

      if (emails.length) {
        emails.forEach(({ email, name }) => {
          switch (type) {
            case "EVENT_ORGANIZER":
              this.notificationEngine.organizerEventCancelled(
                { userId: "organizer", email },
                { organizerName: name }
              );
              break;
            case "EVENT_ARTIST":
              this.notificationEngine.artistEventCancelled(
                { userId: "artist", email },
                { userName: name }
              );
              break;
            case "EVENT_ADVERTISER":
              this.notificationEngine.advertiserEventCancelled(
                { userId: "advertiser", email },
                { userName: name }
              );
              break;
          }
        });
      }
    }
  }
}
