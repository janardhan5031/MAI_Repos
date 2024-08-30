import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ERROR_MESSAGES, FORMAT_DATE, SUCCESS_MESSAGE } from "src/common/config/constants";
import { Advertiser } from "src/common/database/entities/advertiser.entity";
import { Artist } from "src/common/database/entities/artist.entity";
import { Event } from "src/common/database/entities/events.entity";
import { Favorite } from "src/common/database/entities/favorites.entity";
import { Gallery } from "src/common/database/entities/gallery.entity";
import { Organizer } from "src/common/database/entities/organizer.entity";
import { LoggingService } from "src/common/logging/logging.service";
const { ObjectId } = require("mongodb");

@Injectable()
export class GalleryService {
  constructor(
    private readonly logginService: LoggingService,
    @InjectModel(Organizer.name)
    private readonly OrganizerModel: Model<Organizer>,
    @InjectModel(Advertiser.name)
    private readonly AdvertiserModel: Model<Advertiser>,
    @InjectModel(Artist.name)
    private readonly ArtistModel: Model<Artist>,
    @InjectModel(Event.name)
    private readonly EventModel: Model<Event>,
    @InjectModel(Favorite.name)
    private readonly FavoriteModel: Model<Favorite>,
    @InjectModel(Gallery.name)
    private readonly GalleryModel: Model<Gallery>
  ) { }

  async getGallery(loginResponse: any, eventId: String) {
    try {
      const handelingRoles = ["EVENT_VENDOR", "EVENT_ATTENDEE"];
      if (
        !loginResponse ||
        (loginResponse && handelingRoles.includes(loginResponse?.roles[0]))
      ) {
        return new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }
      const loggedInUserId = loginResponse?._id;
      const role = loginResponse?.roles[0];

      let UserModel: Model<any>;

      switch (role) {
        case "EVENT_ARTIST":
          UserModel = this.ArtistModel;
          break;
        case "EVENT_ADVERTISER":
          UserModel = this.AdvertiserModel;
          break;
        case "EVENT_ORGANIZER":
          UserModel = this.OrganizerModel;
          break;
      }

      let userarray = await UserModel.aggregate([
        {
          $match: { userId: loggedInUserId },
        },
      ]);
      if (userarray.length == 0) {
        return new Error(ERROR_MESSAGES.USER_NOT_FOUND_ERROR);
      }

      const userId = userarray[0]._id;

      const pipeline = [];

      pipeline.push({
        $match: {
          user: new ObjectId(userId),
        },
      });

      if (eventId) {
        pipeline.push({
          $match: { event: new ObjectId(eventId) },
        });
      }

      pipeline.push(
        {
          $lookup: {
            from: "events",
            localField: "event",
            foreignField: "_id",
            pipeline: [
              {
                $addFields: {
                  "startingDate": {
                    $dateFromString: {
                      dateString: {
                        $concat: [
                          {
                            $dateToString: {
                              format: FORMAT_DATE.DATE,
                              date: "$startDate",
                            },
                          },
                          "T",
                          "$startTime",
                          FORMAT_DATE.TIME,
                        ],
                      },
                      format: FORMAT_DATE.DATE_TIME,
                    },
                  },
                }
              },
            ],
            as: "eventDetails",
          },
        },
        {
          $unwind: "$eventDetails",
        },
        {
          $addFields: {
            media: { $reverseArray: "$media" },
          }
        },
        {
          $sort: { "eventDetails.startingDate": -1 }
        },
        {
          $project: {
            _id: 1,
            event: 1,
            eventName: "$eventDetails.eventName",
            user: 1,
            media: 1,
          },
        },
        {
          $lookup: {
            from: "favorites",
            localField: "event",
            foreignField: "event",
            pipeline: [
              {
                $match: {
                  userId: new ObjectId(userId)
                }
              }, {
                $project: {
                  media: 1,
                  _id: 0
                }
              }
            ],
            as: "favorites",
          },
        },
        {
          $addFields: {
            favorites: {
              $ifNull: [{ $arrayElemAt: ["$favorites.media", 0] }, []]
            }
          }
        },
        {
          $addFields: {
            media: {
              $map: {
                input: "$media",
                as: "mediaItem",
                in: {
                  $mergeObjects: [
                    "$$mediaItem",
                    {
                      isFavorite: {
                        $in: ["$$mediaItem._id", "$favorites"]
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $project: {
            favorites: 0 // Optionally remove the favorites field if not needed in the output
          }
        }
      );

      let gallery = await this.GalleryModel.aggregate(pipeline);
      return gallery;
    } catch (error) {
      const errorCode = error?.status || 400;
      this.logginService.error("ERROR_WHILE_FETCHING_VENDOR_GALARY", error);
      return error;
    }
  }

  async addToFavorite(
    loginResponse: any,
    eventId: String,
    mediaId: String
  ) {
    try {
      let userarray = await this.OrganizerModel.aggregate([
        {
          $match: { userId: loginResponse?._id },
        },
      ]);
      if (userarray.length == 0) {
        return new Error(ERROR_MESSAGES.USER_NOT_FOUND_ERROR);
      }

      // check organizer own the event or not
      const existingEvent = await this.EventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            organizer: new ObjectId(userarray[0]._id),
            isDeleted : false
          },
        },
      ]);
      if (!existingEvent.length) {
        return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
      }

      // check mediaId found in the organizer gallery
      const userGallery = await this.GalleryModel.aggregate([
        {
          $match: {
            event: new ObjectId(eventId),
            user: new ObjectId(userarray[0]._id),
            "media._id": new ObjectId(mediaId)
          },
        },
        {
          $unwind: "$media"
        },
        {
          $match: {
            "media._id": new ObjectId(mediaId)
          }
        },
        {
          $project: {
            _id: 0,
            media: 1
          }
        }
      ]);
      if (!userGallery.length) {
        return new Error(ERROR_MESSAGES.INVALID_MEDIA_ID);
      } else if (!userGallery[0]?.media) {
        return new Error(ERROR_MESSAGES.IMAGES_NOT_FAVORITE);
      }

      const selectionObj = {
        event: new ObjectId(eventId),
        userId: new ObjectId(userarray[0]._id),
      };
      const existingEventFavorites = await this.FavoriteModel.aggregate([
        {
          $match: selectionObj,
        },  
      ]);

      if (existingEventFavorites.length) {
        if (
          !existingEventFavorites[0].media.find(
            (mId: any) => mId.toString() == mediaId
          )
        ) {
          const pipeline = {
            $addToSet: {
              media: new ObjectId(mediaId),
            },
          };
          await this.FavoriteModel.findOneAndUpdate(selectionObj, pipeline);
          return {
            isOk: true,
            message: SUCCESS_MESSAGE.MEDIA_ADDED_TO_FAVORITE,
          };
        } else {
          const pipeline = {
            $pull: {
              media: new ObjectId(mediaId),
            },
          };
          await this.FavoriteModel.findOneAndUpdate(selectionObj, pipeline);
          return {
            isOk: true,
            message: SUCCESS_MESSAGE.MEDIA_REMOVED_FROM_FAVORITE,
          };
        }
      } else {
        await new this.FavoriteModel({
          ...selectionObj,
          media: [new ObjectId(mediaId)],
        }).save();
      }

      return {
        isOk: true,
        message: SUCCESS_MESSAGE.MEDIA_ADDED_TO_FAVORITE,
      };
    } catch (error) {
      this.logginService.error("ERROR_WHILE_ADDING_MEDIA_FAVORITES", error);
      return error;
    }
  }
}
