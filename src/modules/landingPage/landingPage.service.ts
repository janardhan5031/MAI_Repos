import { Injectable } from "@nestjs/common";
import { PaginationInput } from "src/common/shared/common.input_type";
import { EventsFilter } from "./dto/landingPage.input_type";
import { ERROR_MESSAGES, EVENT_STATUS, EventStatus, FORMAT_DATE, Initialstatus, LOG_MESSAGES, ROLES, SORTBY } from "src/common/config/constants";
import { LoggingService } from "src/common/logging/logging.service";
import { ErrorService } from "src/common/services/errorService";
import { RedisHelperService } from "src/common/redis-helpers/redis-helper.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Organizer } from "src/common/database/entities/organizer.entity";
import { start } from "repl";
import { Favorite } from "src/common/database/entities/favorites.entity";
const { ObjectId } = require("mongodb");
@Injectable()
export class LandingPageService {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly errorService: ErrorService,
    private readonly redisServer: RedisHelperService,
    @InjectModel(Event.name)
    private readonly EventModel: Model<Event>,
    @InjectModel(Organizer.name)
    private readonly OrganizerModel: Model<Organizer>,
  ) { }
  async searchAndSortEvent(
    input: PaginationInput,
    organizer: string,
    filter: EventsFilter,
  ) {
    try {
      /*constants for search sort inputs.*/
      const pageNumber = input?.skip > 0 ? input.skip : 0;
      const limit = input?.limit > 0 ? input?.limit : 10;
      let organizerDetails = await this.OrganizerModel.findOne({ orgName: new RegExp(organizer, 'i') });
      if (!organizerDetails) {
        this.errorService.error({ message: ERROR_MESSAGES.ORGANIZER_NOT_FOUND_ERROR }, 400)
      }
      const pipeline = [];

      /*if event name.*/
      if (filter?.eventName) {
        let searchStage = {
          $search: {
            index: "searchByEventName",
            compound: {
              should: [
                {
                  autocomplete: {
                    query: filter.eventName,
                    path: "eventName",
                  },
                },
              ],
            },
          },
        };
        pipeline.push(searchStage);
      }

      // if category
      const matchStage = {
        isDeleted: false,
        status: EVENT_STATUS.PUBLISHED,
        organizer: new ObjectId(organizerDetails._id),
        isPrivate: false
      };
      if (filter?.categoryId) {
        matchStage["category"] = new ObjectId(filter.categoryId);
      }
      else if (filter?.language) {
        matchStage["languages"] = new ObjectId(filter.language);
      }
      if (filter?.isLive) {
        matchStage["eventStatus"] = EVENT_STATUS.LIVE;
      }
      else if (filter?.isLive === false) {
        matchStage["eventStatus"] = { $nin: [EVENT_STATUS.COMPLETED, EVENT_STATUS.CANCELLED] }
      }
      pipeline.push({ $match: matchStage });
      pipeline.push({
        $addFields: {
          // add only future events considering time also.
          formattedEndDate: {
            $dateFromString: {
              dateString: {
                $concat: [
                  {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$endDate",
                    },
                  },
                  "T",
                  "$startTime",
                  ":00.000Z",
                ],
              },
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
            },
          },
          formattedStartDate: {
            $dateFromString: {
              dateString: {
                $concat: [
                  {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$startDate",
                    },
                  },
                  "T",
                  "$startTime",
                  ":00.000Z",
                ],
              },
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
            },
          },
        },
      },
        {
          $addFields: {
            formattedEndDate: {
              $add: [
                { $toDate: "$formattedEndDate" }, // Convert UTC date to ISODate
                { $multiply: ["$duration", 3600000] }, // Convert hours to milliseconds
              ],
            },
          },
        },
        {
          $match: {
            formattedEndDate: { $gt: new Date() }
          }
        },
        {
          $lookup: {
            from: "venues",
            localField: "venue",
            foreignField: "_id",
            pipeline: [{ $project: { name: 1, _id: 0 } }],
            as: "venue",
          },
        },
        {
          $unwind: {
            path: "$venue",
            preserveNullAndEmptyArrays: true,
          },
        },)
      /*if sortBy*/
      if (filter?.sortBy) {
        pipeline.push(
          {
            $sort:
              filter.sortBy === SORTBY.LATEST
                ? { formattedStartDate: -1 }
                : filter.sortBy === SORTBY.HIGHTOLOW
                  ? { price: -1 }
                  : { price: 1 },
          }
        );
      }
      const result = await this.EventModel.aggregate([
        ...pipeline,
        {
          $project: {
            eventName: 1,
            venue: "$venue.name",
            startDate: 1,
            endDate: 1,
            startTime: 1,
            endTime: 1,
            ticketPrice: 1,
            thumbnail: 1,
            coverPhoto: 1,
            eventStatus: 1,
          },
        },
        {
          $facet: {
            eventsList: [{ $skip: pageNumber * limit }, { $limit: limit }],
            totalEvents: [
              {
                $count: "totalEvents",
              },
            ],
          },
        },
      ]);

      return {
        eventsList: result[0].eventsList,
        totalEvents: result[0]?.totalEvents[0]?.totalEvents || 0,
      };
    } catch (error) {
      const errorCode = error?.status || 400;
      this.errorService.error({ message: error }, errorCode);
      LoggingService.error(ERROR_MESSAGES.CHECK_EVENT_ERROR, error);
      return error;
    }
  }

  async previousEvents(
    organizer: string,
    input: PaginationInput,
  ) {
    try {
      /*constants for search sort inputs.*/
      const pageNumber = input?.skip > 0 ? input.skip : 0;
      const limit = input?.limit > 0 ? input?.limit : 10;
      let organizerDetails = await this.OrganizerModel.findOne({ orgName: new RegExp(organizer, 'i') });
      if (!organizerDetails) {
        this.errorService.error({ message: ERROR_MESSAGES.ORGANIZER_NOT_FOUND_ERROR }, 400)
      }
      const pipeline = [];
      const matchStage = {
        isDeleted: false,
        isPrivate: false,
        status: EVENT_STATUS.PUBLISHED,
        $or: [
          { eventStatus: EVENT_STATUS.COMPLETED },
          {
            eventStatus: EVENT_STATUS.LIVE,
          }
        ],
        organizer: new ObjectId(organizerDetails._id)
      };
      pipeline.push({ $match: matchStage });
      pipeline.push(
        {
          $addFields: {
            // add only future events considering time also.
            formattedEndDate: {
              $dateFromString: {
                dateString: {
                  $concat: [
                    {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$endDate",
                      },
                    },
                    "T",
                    "$startTime",
                    ":00.000Z",
                  ],
                },
                format: "%Y-%m-%dT%H:%M:%S.%LZ",
              },
            },
            startDate: {
              $dateFromString: {
                dateString: {
                  $concat: [
                    {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$startDate",
                      },
                    },
                    "T",
                    "$startTime",
                    ":00.000Z",
                  ],
                },
                format: "%Y-%m-%dT%H:%M:%S.%LZ",
              },
            }
          },
        },
        {
          $addFields: {
            formattedEndDate: {
              $add: [
                { $toDate: "$formattedEndDate" }, // Convert UTC date to ISODate
                { $multiply: ["$duration", 3600000] }, // Convert hours to milliseconds
              ],
            },
          },
        },
        {
          $match: {
            formattedEndDate: { $lte: new Date() }
          }
        },
        {
          $addFields: {
            eventStatus: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$eventStatus", EventStatus.LIVE] },
                    { $lte: ["$formattedEndDate", new Date()] }
                  ]
                },
                then: EventStatus.COMPLETED,
                else: "$eventStatus"
              }
            }
          }
        },

        {
          $lookup: {
            from: "venues",
            localField: "venue",
            foreignField: "_id",
            pipeline: [{ $project: { name: 1, _id: 0 } }],
            as: "venue",
          },
        },
        {
          $unwind: {
            path: "$venue",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { formattedEndDate: -1 }
        },
        {
          $project: {
            eventName: 1,
            venue: "$venue.name",
            startDate: 1,
            endDate: 1,
            startTime: 1,
            endTime: 1,
            ticketPrice: 1,
            thumbnail: 1,
            coverPhoto: 1,
            eventStatus: 1,
          },
        },
        {
          $facet: {
            eventsList: [{ $skip: pageNumber * limit }, { $limit: limit }],
            totalEvents: [
              {
                $count: "totalEvents",
              },
            ],
          },
        },
      )
      const result = await this.EventModel.aggregate([
        ...pipeline,
      ]);

      return {
        eventsList: result[0].eventsList,
        totalEvents: result[0]?.totalEvents[0]?.totalEvents || 0,
      };
    } catch (error) {
      const errorCode = error?.status || 400;
      this.errorService.error({ message: error }, errorCode);
      LoggingService.error(ERROR_MESSAGES.ERROR_WHILE_GETTING_PREVIOUS_EVENTS, error);
      return error;
    }
  }
  async organizerProfile(
    organizer: string,
  ) {
    try {
      let [organizerDetails] = await this.OrganizerModel.aggregate([
        {
          $match:
          {
            orgName: { $regex: new RegExp(organizer, 'i') },
            isDeleted: false
          }
        },
        {
          $lookup: {
            from: "events",
            localField: "_id",
            foreignField: "organizer",
            pipeline: [{
              $match: {
                status: EVENT_STATUS.PUBLISHED,
                isDeleted: false
              },
            },
            { $project: { _id: 1 } }
            ],
            as: "events",
          },
        },
        {
          $addFields: {
            totalEvents: { $size: "$events" }
          }
        }
      ])
      if (!organizerDetails) {
        this.errorService.error({ message: ERROR_MESSAGES.ORGANIZER_NOT_FOUND_ERROR }, 400)
      }
      return organizerDetails ? organizerDetails : null
    } catch (error) {
      const errorCode = error?.status || 400;
      this.errorService.error({ message: error }, errorCode);
      LoggingService.error(LOG_MESSAGES.ERROR_WHILE_GETTING_ORGANIZER_PROFILE, error);
      return error;
    }
  }
  async latestArtistAndGallery(
    organizer: string,
  ) {
    try {
      let organizerDetails = await this.OrganizerModel.findOne({ orgName: new RegExp(organizer, 'i') });
      if (!organizerDetails) {
        this.errorService.error({ message: ERROR_MESSAGES.ORGANIZER_NOT_FOUND_ERROR }, 400);
      }
      let events = await this.EventModel.aggregate([
        {
          $match: {
            organizer: new ObjectId(organizerDetails._id),
            isDeleted: false,
            status: EVENT_STATUS.PUBLISHED,
            eventStatus: { $nin: [null, EVENT_STATUS.SALESCHEDULED,] },
          },
        },
        {
          $sort: {
            startDate: -1,
          },
        },
        {
          $lookup: {
            from: "ownerships",
            let: { event: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$event", "$$event"] },
                      { $eq: ["$isDeleted", false] },
                      { $eq: ["$type", ROLES.EVENT_ARTIST] },
                    ],
                  },
                },
              },
              {
                $project: { ownerId: 1, _id: 0 },
              },
            ],
            as: "slots",
          },
        },
        {
          $project: {
            _id: 1,
            isDeleted: 1,
            slots: 1,
          },
        },
        {
          $unwind: "$slots",
        },
        {
          $addFields: {
            artists: "$slots.ownerId",
          },
        },
        {
          $group: {
            _id: null,
            uniqueArtists: { $addToSet: "$artists" },
          },
        },
        {
          $unwind: "$uniqueArtists",
        },
        {
          $limit: 12
        },
        {
          $project: {
            artistId: 0,
          },
        },
        {
          $lookup: {
            from: "artists",
            localField: "uniqueArtists",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  name: "$preferredName",
                  tags: 1,
                  artistImage: 1,
                  _id: 1,
                },
              },
            ],
            as: "uniqueArtists",
          },
        },
        {
          $unwind: "$uniqueArtists",
        },
        {
          $replaceRoot: { newRoot: "$uniqueArtists" }
        },
      ]);

      return {
        Artists: events ? events : [],
      };
    } catch (error) {
      const errorCode = error?.status || 400;
      this.errorService.error({ message: error }, errorCode);
      LoggingService.error(
        LOG_MESSAGES.ERROR_WHILE_GETTING_ORGANIZER_PROFILE,
        error
      );
      return error;
    }
  }

  async getOrganizerFavorites(organizer: string) {
    try {
      let organizerDetails = await this.OrganizerModel.findOne({ orgName: new RegExp(organizer, 'i') });

      if (!organizerDetails) {
        this.errorService.error({ message: ERROR_MESSAGES.ORGANIZER_NOT_FOUND_ERROR }, 400);
      }
      const [favoritesMedia] = await this.EventModel.aggregate([
        {
          $match: {
            organizer: new ObjectId(organizerDetails._id),
            isDeleted: false,
            status: EVENT_STATUS.PUBLISHED,
            eventStatus: {
              $in: [
                EVENT_STATUS.COMPLETED,
                EVENT_STATUS.LIVE,
                EVENT_STATUS.ONGOING,
              ],
            },
          },
        },
        {
          $addFields: {
            "startDate": {
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
          },
        },
        {
          $project: {
            _id: 1,
            eventName: 1,
            organizer: 1,
            startDate: 1,
          }
        },
        {
          $sort: {
            startDate: -1,
          },
        },
        {
          $lookup: {
            from: "favorites",
            let: { event: "$_id", eventName: "$eventName", startDate: "$startDate", organizer: "$organizer" },
            pipeline: [
              {
                $match: {
                  userId: new ObjectId(organizerDetails._id),
                  $expr: {
                    $and: [{ $eq: ["$event", "$$event"] }]
                  },
                },
              },
              {
                $unwind: "$media",
              },
              {
                $lookup: {
                  from: "galleries",
                  let: { mediaId: "$media", event: "$event", eventName: "$eventName", startDate: "$startDate" },
                  pipeline: [

                    {
                      $match: {
                        $expr: {
                          $eq: ["$event", "$$event"],
                        },
                      },
                    },
                    {
                      $unwind: "$media",
                    },
                    {
                      $match: {
                        $expr: {
                          $eq: ["$media._id", "$$mediaId"],
                        },
                      },
                    },
                  ],
                  as: "galleryItem",
                },
              },
              { $unwind: "$galleryItem" },
              {
                $addFields: {
                  "galleryItem.media._id": "$$event",
                  "galleryItem.media.eventName": "$$eventName",
                  "galleryItem.media.startDate": "$$startDate"
                }
              },
              {
                $group: {
                  media: { $push: "$galleryItem.media" },
                  _id: 0
                },
              },
            ],
            as: "favorites",
          },
        },

        {
          $match: {
            favorites: { $ne: [] }
          }
        },
        {
          $unwind: "$favorites"
        },
        {
          $project: {
            _id: 0,
            favorites: "$favorites.media"
          }
        },
        {
          $unwind: "$favorites"
        },
        {
          $limit: 12
        },
        {
          $group: {
            _id: null,
            favorites: { $push: "$favorites" }
          }
        },

      ]);
      return favoritesMedia?.favorites
        ? favoritesMedia?.favorites
        : [];
    } catch (error) {
      const errorCode = error?.status || 400;
      this.errorService.error({ message: error }, errorCode);
      LoggingService.error(LOG_MESSAGES.ORGANIZER_FAVORITES_FETCH_ERROR, error);
      return error;
    }
  }

}
