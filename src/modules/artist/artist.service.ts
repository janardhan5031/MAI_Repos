import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Artist } from "../../common/database/entities/artist.entity";
import { LoggingService } from "src/common/logging/logging.service";
import { Slot } from "src/common/database/entities/slots.entity";
import { ErrorService } from "src/common/services/errorService";
import {
  addArtistInput,
  onboardArtist,
  setpasswordInput,
} from "./dto/artist.input_types";
import { AuthEngine } from "src/common/services/auth_engine";
import {
  EventsFilterInput,
  PaginationInput,
} from "src/common/shared/common.input_type";
import { KafkaService } from "src/common/kafka/kafka.service";
import { ConfigurationService } from "src/common/config/config.service";
import { Ownership } from "src/common/database/entities/meta/ownership.entity";
import { Organizer } from "src/common/database/entities/organizer.entity";
const { ObjectId } = require("mongodb");
import { Advertiser } from "src/common/database/entities/advertiser.entity";
import { NotificationEngine } from "src/common/services/notification_engine";
import { Banner } from "src/common/database/entities/banner.entity";
import {
  ARTIST_PROGRESS,
  ERROR_MESSAGES,
  EVENT_STATUS,
  EventStatus,
  FORMAT_DATE,
  INDEX_NAME,
  LOG_MESSAGES,
  ROLES,
  SUCCESS_MESSAGE,
} from "src/common/config/constants";
import { checkEventStatusBeforeAddingDetails, eventCheckbeforePayment, generateSequence, getEvents } from "src/common/helper/helper";
import { SetArtistPerformanceMode } from "./dto/artist.input_types";
import { VenueService } from "../venue/venue.service";


@Injectable()
export class ArtistService {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly errorService: ErrorService,
    private readonly venueService: VenueService,
    private readonly authEngine: AuthEngine,
    private readonly notificationEngine: NotificationEngine,
    @InjectModel(Artist.name)
    private readonly artistModel: Model<Artist>,
    @InjectModel(Advertiser.name)
    private readonly advertiserModel: Model<Advertiser>,
    @InjectModel(Ownership.name)
    private readonly ownershipModel: Model<Ownership>,
    @InjectModel(Banner.name)
    private readonly bannerModel: Model<Banner>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<Event>,
    @InjectModel(Organizer.name)
    private readonly organizerModel: Model<Organizer>,
    @InjectModel(Slot.name)
    private readonly SlotModel: Model<Slot>,
    private readonly kafkaService: KafkaService,
    private readonly config: ConfigurationService,
    @InjectModel(Advertiser.name)
    private readonly AdvertiserModel: Model<Advertiser>,
    @InjectModel(Artist.name)
    private readonly ArtistModel: Model<Artist>
  ) { }

  async getArtistDetails(
    name: string,
    eventId: string,
    pagination: PaginationInput,
    loginResponse: any
  ) {
    try {
      // Check if the user is an organizer
      if (!loginResponse?.isOrganizer) {
        this.errorService.error(
          { message: ERROR_MESSAGES.NOT_AN_ORGANIZER },
          400
        );
      }
      // Retrieve the event details based on the provided eventId and organizer's userId
      let [event] = await this.eventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            organizer: new ObjectId(loginResponse?.userId),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "eventcategories",
            localField: "category",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  eventCategory: 1,
                  _id: 0
                }
              }
            ],
            as: "eventCategory"
          }
        },
        {
          $project: {
            _id: 0,
            startDate: 1,
            startTime: 1,
            endTime: 1,
            endDate: 1,
            eventName: 1,
            duration: 1,
            eventStatus: 1,
            status: 1,
            category: { $arrayElemAt: ["$eventCategory.eventCategory", 0] }
          },
        },
      ]);
      checkEventStatusBeforeAddingDetails(event)
      // Construct aggregation pipeline for artist data retrieval
      const pipeline = [];
      let search = {};
      let project = {};
      let match = {};
      let skip = {};
      let limit = {};
      // Perform text search based on the provided artist name
      if (name) {
        search = {
          $search: {
            index: INDEX_NAME.ARTIST_SEARCH_INDEX,
            autocomplete: {
              query: name,
              path: "preferredName",
            },
          },
        };
        pipeline.push(search);
      }
      match = {
        $match: { isDeleted: false },
      };
      skip = { $skip: pagination.skip < 0 ? 0 : pagination.skip };
      limit = { $limit: pagination.limit > 0 ? pagination.limit : 10 };
      project = { $project: { name: "$preferredName", isKYCVerified: 1 } };
      pipeline.push(match);
      pipeline.push(skip);
      pipeline.push(limit);
      pipeline.push(project);
      let eventTime = await generateSequence(`${event.startTime}-${event.endTime}`)
      // Retrieve artist data based on the constructed pipeline
      const artistData = await this.artistModel.aggregate(pipeline);
      //the dates between an event's start and end dates to check the artist's availability within those days
      let dates = getDatesBetween(event.startDate, event.endDate);
      let isConditionMet;
      let artists = await Promise.all(
        artistData.map(async (artist, indexouter) => {
          isConditionMet = false;
          for (const [index, date] of dates.entries()) {
            let [hours, minutes] = event.startTime.split(":").map(Number)
            let currentDate = new Date(date);
            let startDate = new Date(
              currentDate.setUTCHours(hours, minutes, 0, 0)
            );
            let endDate = new Date(
              currentDate.setUTCHours(hours + event.duration, minutes, 0, 0)
            );
            // Retrieve slot data for the artist within the specified date range
            let pipelineSlot = [];
            pipelineSlot.push(
              {
                // Match slots based on artistId, isDeleted status, and date range
                $match: {
                  isDeleted: false,
                  $or: [
                    {
                      $and: [
                        { startDate: { $lte: startDate } },
                        { endDate: { $gt: startDate } },
                      ],
                    },
                    {
                      $and: [
                        { startDate: { $lt: endDate } },
                        { endDate: { $gte: endDate } },
                      ],
                    },
                    {
                      $and: [
                        { startDate: { $gte: startDate } },
                        { endDate: { $lte: endDate } },
                      ],
                    },
                  ],
                }

              },
              {
                $facet: {
                  artistSlots: [
                    {
                      $match: {
                        artistId: new ObjectId(artist._id),
                      },
                    },
                    {
                      $addFields: {
                        // Create a range of hours from 'slotStartHour' to 'slotStartHour + dateDiff'
                        slothours: "$timeArray",
                      },
                    },
                  ],
                  eventSlots: [
                    {
                      $match: {
                        eventId: new ObjectId(eventId),
                      },
                    },
                    {
                      $addFields: {
                        // Create a range of hours from 'slotStartHour' to 'slotStartHour + dateDiff'
                        slothours: "$timeArray",
                        hours: eventTime,
                      },
                    },
                    {
                      $group: {
                        _id: null,
                        slothours: { $addToSet: "$slothours" },
                        hours: { $addToSet: "$hours" },
                      },
                    },
                    {
                      $project: {
                        _id: 0,
                        slothours: {
                          $reduce: {
                            input: "$slothours",
                            initialValue: [],
                            in: { $concatArrays: ["$$value", "$$this"] },
                          },
                        },
                        hours: {
                          $reduce: {
                            input: "$hours",
                            initialValue: [],
                            in: { $concatArrays: ["$$value", "$$this"] },
                          },
                        },
                      },
                    },
                    {
                      $project: {
                        slothours: 1,
                        hours: 1,
                        modifiedHours: 1,
                        availableHours: {
                          $setDifference: ["$hours", "$slothours"],
                        },
                      },
                    },
                  ],
                },
              },
              {
                $unwind: {
                  path: "$eventSlots",
                  preserveNullAndEmptyArrays: true,
                }
              },
              {
                $unwind: {
                  path: "$artistSlots",
                  preserveNullAndEmptyArrays: true,
                }
              },
              {
                $group: {
                  _id: null,
                  slothours: { $addToSet: "$artistSlots.slothours" },
                  hours: {
                    $addToSet: {
                      $ifNull: ["$eventSlots.availableHours", eventTime]
                    },
                  }
                },
              },
              {
                $project: {
                  _id: 0,
                  slotHours: {
                    $reduce: {
                      input: "$slothours",
                      initialValue: [],
                      in: { $concatArrays: ["$$value", "$$this"] },
                    },
                  },
                  hours: {
                    $reduce: {
                      input: "$hours",
                      initialValue: [],
                      in: { $concatArrays: ["$$value", "$$this"] },
                    },
                  },
                },
              },
            )
            if (event.category != "Debate") {
              pipelineSlot.push({
                $project: {
                  slotHours: 1,
                  hours: 1,
                  isMatch: {
                    $eq: [
                      {
                        $allElementsTrue: {
                          $map: {
                            input: "$hours",
                            as: "el",
                            in: { $in: ["$$el", "$slotHours"] },
                          },
                        },
                      },
                      true,
                    ],
                  },
                },
              },)
            }
            else {
              pipelineSlot.push({
                $project: {
                  slotHours: 1,
                  hours: 1,
                  isMatch: {
                    $cond: {
                      if: { $eq: ["$slotHours", []] },
                      then: false,
                      else: true
                    }
                  }
                }
              },)
            }

            let slot = await this.SlotModel.aggregate(pipelineSlot)
            // Check if the artist is available in the specified date range
            isConditionMet = slot[0]?.isMatch === true || slot[0]?.hours.length === 0 ? false : true;
            if (isConditionMet) {
              break;
            }
          }
          return isConditionMet ? artistData[indexouter] : null;
        })
      );
      // Filter out artists that do not meet the condition
      artists = artists.filter((date) => date !== null);

      return artists;
    } catch (error) {
      this.loggingService.error(
        LOG_MESSAGES.GETTING_ARTIST_DETAILS_ERROR,
        error
      );
      return error;
    }
  }

  async getArtistsEvents(
    filterInput: EventsFilterInput,
    paginationInput: PaginationInput,
    loginResponse: any
  ) {
    try {
      let model;
      let role;
      // Determine the user's role
      if (loginResponse.roles.includes(ROLES.EVENT_ARTIST)) {
        if (
          [
            EVENT_STATUS.DRAFT,
            EVENT_STATUS.UNPUBLISHED,
            EVENT_STATUS.PUBLISHED,
          ].includes(filterInput.status)
        ) {
          return {
            data: [],
            total: 0,
            filtered: 0,
          };
        }
        model = this.artistModel;
        role = ROLES.EVENT_ARTIST;
      } else if (loginResponse.roles.includes(ROLES.EVENT_ADVERTISER)) {
        if (
          [
            EVENT_STATUS.DRAFT,
            EVENT_STATUS.UNPUBLISHED,
            EVENT_STATUS.PUBLISHED,
          ].includes(filterInput.status)
        ) {
          return {
            data: [],
            total: 0,
            filtered: 0,
          };
        }
        model = this.advertiserModel;
        role = ROLES.EVENT_ADVERTISER;
      }
      // Get the user ID based on the role
      let userId = await model.findOne({
        userId: loginResponse._id,
      });
      // Define the initial match status for filtering events
      let { expr, matchStatus } = await getEvents(filterInput.status);
      let skip = paginationInput.skip >= 0 ? paginationInput.skip : 0;
      let limit = paginationInput.limit > 0 ? paginationInput.limit : 3;
      let pipeline = [];
      let match = {};
      let search = {};
      let currentDate = new Date(
        new Date().setUTCSeconds(0, 0)
      );
      // Perform search based on filterInput.name (org, Artist, Advertiser, Vendor Name)
      if (filterInput.name) {
        search = {
          $search: {
            index: INDEX_NAME.DYNAMIC_SEARCH,
            compound: {
              should: [
                {
                  autocomplete: {
                    query: filterInput.name,
                    path: "eventName",
                  },
                },
              ],
            },
          },
        };
        pipeline.push(search);
      }
      // Match documents based on user role and ownership
      match = {
        $match: {
          type: role,
          ownerId: new ObjectId(userId),

        },
      };
      if (filterInput.status != EVENT_STATUS.CANCELLED) {
        match["$match"]["$expr"] = expr;
      }
      // Lookup banners associated with the events
      let lookup_banner = {
        $lookup: {
          from: "banners",
          let: { ownerId: "$event.ownershipId", eventId: "$event._id" }, // Use the _id field from the current collection
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$owner", "$$ownerId"] }, // Match the owner field with the _id
                    { $eq: ["$isDeleted", false] }, // Additional match condition for isDeleted
                  ],
                },
              },
            },
          ],
          as: "event.banners",
        },
      };

      // Add a field for the count of banners associated with each event
      let addfiled_bannrCount = {
        $addFields: {
          "event.bannersCount": { $size: "$event.banners" },
        },
      };

      // Lookup events associated with the ownership
      let lookup_events = {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          pipeline: [
            {
              $addFields: {
                "endDate": {
                  $dateFromString: {
                    dateString: {
                      $concat: [
                        {
                          $dateToString: {
                            format: FORMAT_DATE.DATE,
                            date: "$endDate",
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
            {
              $addFields: {
                endTimeDate: {
                  $add: [
                    { $toDate: "$endDate" }, // Convert UTC date to ISODate
                    { $multiply: ["$duration", 3600000] }, // Convert hours to milliseconds
                  ],
                },
              },
            },
            {
              $match: matchStatus
            },

            {
              $project: {
                _id: 1,
                eventName: 1,
                endTime: 1,
                endTimeDate: 1,
                startTime: 1,
                startDate: 1,
                endDate: 1,
                venue: 1,
                ticketCount: 1,
                ticketsLeft: 1,
                isDeleted: 1,
                isFreeEntry: 1,
                createdAt: 1,
                deletedAt: 1,
                thumbnail: 1,
                coverPhoto: 1,
                status: 1,
                slots: 1,
                eventStatus: 1,
                category: 1
              },
            },
          ],
          as: "event",
        },
      };
      let unwind = {
        $unwind: {
          path: "$event",
          preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
        },
      };
      let sort;
      if (!loginResponse.isOrganizer) {
        sort = { $sort: { "event.startDate": -1 } };
      } else {
        sort = { $sort: { "event.createdAt": -1 } };
      }
      let addfield_customAvatar = {
        $addFields: {
          "event.customAvatar": "$customAvatar",
          "event.ownershipId": "$_id",
          "event.filteredTimeSlot": {
            $filter: {
              input: "$timeSlot",
              as: "slot",
              cond: {
                $or: [
                  {
                    $and: [
                      { $lte: ["$$slot.startTime", new Date(currentDate)] },
                      { $gt: ["$$slot.endTime", new Date(currentDate)] }
                    ]
                  },
                  {
                    $and: [
                      { $gte: ["$$slot.startTime", new Date(currentDate)] },
                      { $lt: ["$$slot.endTime", new Date(currentDate)] }
                    ]
                  }
                ]
              }

            }
          }
        },
      }

      let addfield_timeSlot = {
        $unwind: {
          path: "$event.filteredTimeSlot",
          preserveNullAndEmptyArrays: true // Preserve if filteredTimeSlot is null or empty
        }
      }
      // Group the results to get the final structure
      let group = {
        $group: {
          _id: null,
          event: { $push: "$event" },
          totalCount: { $sum: 1 }
        },
      };

      // Match documents where the 'event' array is not empty
      let match_event = {
        $match: { event: { $ne: [] } },
      };
      // Add stages to the pipeline
      pipeline.push(
        match,
      );
      pipeline.push({ $project: { event: 1, ownerId: 1, customAvatar: 1, timeSlot: 1 } })
      pipeline.push(lookup_events, match_event)
      pipeline.push(unwind, addfield_customAvatar, addfield_timeSlot, group, unwind);
      if (!filterInput.name) {
        pipeline.push(sort);
      }

      pipeline.push({ $skip: skip * limit })
      pipeline.push({ $limit: limit })
      pipeline.push({
        $lookup: {
          from: "slots",
          let: { eventId: "$event._id", event_delete_status: "$event.isDeleted" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$eventId", "$$eventId"] },
                    { $eq: ["$isDeleted", "$$event_delete_status"] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                artistId: 1,
              },
            },
          ],
          as: "event.slots",
        },
      },
        {
          $lookup: {
            from: "eventcategories",
            localField: "event.category",
            foreignField: "_id",
            pipeline: [{ $project: { eventCategory: 1, role: 1, _id: 1 } }],
            as: "event.category",
          }
        },
        {
          $unwind: {
            path: "$event.category",
            preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
          },
        },
        {
          $lookup: {
            from: "venues",
            localField: "event.venue",
            foreignField: "_id",
            pipeline: [{ $project: { name: 1, _id: 0 } }],
            as: "event.venue",
          },
        },
        {
          $unwind: {
            path: "$event.venue",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            "event.startDate": {
              $dateFromString: {
                dateString: {
                  $concat: [
                    {
                      $dateToString: {
                        format: FORMAT_DATE.DATE,
                        date: "$event.startDate",
                      },
                    },
                    "T",
                    "$event.startTime",
                    FORMAT_DATE.TIME,
                  ],
                },
                format: FORMAT_DATE.DATE_TIME,
              },
            },
            "event.endDate": {
              $dateFromString: {
                dateString: {
                  $concat: [
                    {
                      $dateToString: {
                        format: FORMAT_DATE.DATE,
                        date: "$event.endDate",
                      },
                    },
                    "T",
                    "$event.startTime",
                    FORMAT_DATE.TIME,
                  ],
                },
                format: FORMAT_DATE.DATE_TIME,
              },
            },
            "event.endTimeDate": {
              $dateFromString: {
                dateString: {
                  $concat: [
                    {
                      $dateToString: {
                        format: FORMAT_DATE.DATE,
                        date: "$event.endDate",
                      },
                    },
                    "T",
                    "$event.endTime",
                    FORMAT_DATE.TIME,
                  ],
                },
                format: FORMAT_DATE.DATE_TIME,
              },
            },
          },
        },
        {
          $addFields: {
            "event.artists": { $size: "$event.slots" }
          },
        },
      )
      loginResponse.isOrganizer || loginResponse.isArtist
        ? null
        : pipeline.push(lookup_banner, addfiled_bannrCount);
      pipeline.push({
        $addFields: {
          "event.totalCount": "$totalCount",
        }
      },
        {
          $project: {
            _id: 0,
            event: 1,
          },
        }, {
        $group: {
          _id: null,
          event: { $push: "$event" }
        }
      })
      let events = await this.ownershipModel.aggregate(pipeline);
      return {
        data: events[0]?.event ? events[0]?.event : [],
        total: events[0]?.event[0]?.totalCount ? events[0]?.event[0]?.totalCount : 0,
        filtered: events[0]?.event.length ? events[0]?.event.length : 0,
      };
    } catch (error) {
      this.loggingService.error(
        LOG_MESSAGES.GETTING_ARTIST_DETAILS_ERROR,
        error
      );
      return error;
    }
  }


  // Method to register an artist
  async registerArtist(artistInput: onboardArtist, loginResponse: any) {
    try {
      // Check if the user is an organizer
      if (!loginResponse?.isOrganizer) {
        this.errorService.error(
          { message: ERROR_MESSAGES.NOT_AN_ORGANIZER },
          400
        );
      }
      artistInput["createdAt"] = new Date();
      // Save artist details in the database
      let artist = await new this.artistModel(artistInput);
      await artist.save();

      // If artist details are successfully savepd, trigger a Kafka call
      if (artist) {
        // Trigger a Kafka call to experience and attendees backend
        this.kafkaService.sendMessage(
          this.config.getKafkaTopic("ONBOARD_ARTIST"),
          artist
        );
        return true;
      }
    } catch (error) {
      // Log the error and throw an error response
      this.loggingService.error(LOG_MESSAGES.REGISTER_ARTIST_ERROR, error);
      this.errorService.error({ message: error }, 400);
    }
  }

  async updateArtist(artistInput: onboardArtist, loginResponse: any) {
    try {
      if (!loginResponse.isArtist) {
        this.errorService.error(
          { message: ERROR_MESSAGES.USER_NOT_ARTIST_ERROR },
          400
        );
      }
      let artist = await this.artistModel.findOne({
        userId: loginResponse._id,
      });
      // Conditionally add preferredName if it has a value other than null
      if (artistInput?.preferredName) {

        let [result] = await this.artistModel.aggregate([
          {
            $match: {
              isDeleted: false,
              preferredName: artistInput?.preferredName.trim(),
              email: { $ne: artist?.email },
            },
          },
        ]);
        if (!!result) {
          this.errorService.error(
            { message: ERROR_MESSAGES.ARTIST_PREFERRED_ANME_EXISTS },
            400
          );
        }
      }
      let json = {};
      // Prepare the update JSON with default values from the existing artist data
      json["socialMedia"] = {};
      json["socialMedia"]["facebookLink"] =
        artistInput?.socialMedia?.facebookLink
          ? artistInput?.socialMedia?.facebookLink.trim()
          : null;
      json["socialMedia"]["instaLink"] =
        artistInput?.socialMedia?.instaLink
          ? artistInput?.socialMedia?.instaLink.trim()
          : null;
      json["socialMedia"]["twitterLink"] = artistInput?.socialMedia?.twitterLink
        ? artistInput?.socialMedia?.twitterLink.trim()
        : null;
      artistInput?.description
        ? (json["description"] = artistInput.description
          .trim()
          .replace(/\s+/g, " "))
        : null;
      artistInput?.artistImage
        ? (json["artistImage"] = artistInput.artistImage.trim())
        : null;

      artistInput?.preferredName
        ? (json["preferredName"] =
          artistInput.preferredName
            .trim()
            .replace(/\s+/g, " ")
            .charAt(0)
            .toUpperCase() +
          artistInput.preferredName
            .trim()
            .replace(/\s+/g, " ")
            .slice(1))
        : null;
      artistInput?.tags ? (json["tags"] = artistInput.tags) : null;
      artistInput["updatedAt"] = new Date();
      // const response = await this.authEngine.updateuserProfile(
      //   artistInput.preferredName,
      //   loginResponse
      // );
      /*Check user password. if set succesfully then set isEmail true.*/
      ///&& !response.isOk
      if (!!artist) {
        // Update the artist if found
        let updateArtist = await this.artistModel.findByIdAndUpdate(
          { _id: artist._id },
          json,
          { new: true }
        );
        if (updateArtist) {
          // If artist is updated, trigger a Kafka call to experience and attendees backend
          if (artistInput?.preferredName) {
            await this.ownershipModel.updateMany(
              { ownerId: new ObjectId(artist._id), isDeleted: false },
              { $set: { name: updateArtist.preferredName } }
            );
          }
          this.kafkaService.sendMessage(
            this.config.getKafkaTopic("UPDATE_ARTIST"),
            updateArtist
          );
          return {
            data: updateArtist,
            isOk: true,
            message: SUCCESS_MESSAGE.ARTIST_UPDATE_SUCCESS,
          };
        }
      } else {
        this.loggingService.error(
          ERROR_MESSAGES.UPDATE_ARTIST_ERROR,
          ERROR_MESSAGES.ARTIST_NOT_FOUND
        );
        this.errorService.error(
          { message: ERROR_MESSAGES.ARTIST_NOT_FOUND },
          400
        );
      }
    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.UPDATE_ARTIST_ERROR, error);
      this.errorService.error({ message: error }, 400);
    }
  }

  async artistProfile(loginResponse: any) {
    try {
      if (!loginResponse.isArtist) {
        this.errorService.error(
          { message: ERROR_MESSAGES.USER_NOT_ARTIST_ERROR },
          400
        );
      }
      let artist = await this.artistModel.findOne({
        userId: loginResponse._id,
      });
      if (!!artist) {
        return artist;
      } else {
        this.loggingService.error(
          ERROR_MESSAGES.GETTING_ARTIST_DETAILS_ERROR,
          ERROR_MESSAGES.ARTIST_NOT_FOUND
        );
        this.errorService.error(
          { message: ERROR_MESSAGES.ARTIST_NOT_FOUND },
          400
        );
      }
    } catch (error) {
      this.loggingService.error(
        ERROR_MESSAGES.GETTING_ARTIST_DETAILS_ERROR,
        error
      );
      this.errorService.error({ message: error }, 400);
    }
  }

  async onboardArtist(addArtistInput: addArtistInput, loginResponse: any) {
    try {
      if (!loginResponse?.isOrganizer) {
        this.errorService.error(
          { message: ERROR_MESSAGES.NOT_AN_ORGANIZER },
          400
        );
      }
      addArtistInput["roles"] = [ROLES.EVENT_ARTIST];
      addArtistInput.firstName = addArtistInput.firstName.trim();
      addArtistInput.lastName = addArtistInput.lastName.trim();
      addArtistInput.preferredName = addArtistInput.preferredName.trim();
      addArtistInput.email = addArtistInput.email.trim();
      let preferredName = addArtistInput.preferredName;
      let result = await this.artistModel.aggregate([
        {
          $facet: {
            artistExists: [
              {
                $match: {
                  email: addArtistInput.email,
                },
              },
            ],
            artistNameExists: [
              {
                $match: {
                  isDeleted: false,
                  preferredName: addArtistInput.preferredName,
                  email: { $ne: addArtistInput.email },
                },
              },
            ],
          },
        },
      ]);
      let artistExists = result[0]?.artistExists[0];
      let artistNameExists = result[0]?.artistNameExists[0];
      if (!!artistNameExists) {
        this.errorService.error(
          { message: ERROR_MESSAGES.ARTIST_PREFERRED_ANME_EXISTS },
          400
        );
      }
      if (artistExists && artistExists?.isEmailVerified) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.ARTIST_EMAIL_EXISTS_ERROR },
          400
        );
      }
      const response = await this.authEngine.inviteRegistration(addArtistInput);
      this.loggingService.log(
        `${LOG_MESSAGES.ARTIST_REGISTER_SUCCESS} ${JSON.stringify(
          addArtistInput
        )}`
      );
      if (!artistExists && !!response.data) {
        let data: any = {
          email: addArtistInput.email,
          name: addArtistInput.firstName + " " + addArtistInput.lastName,
          userId: response.data.userId,
          preferredName: preferredName,
          organizer: loginResponse._id,
        };
        let artist = await this.registerArtist(data, loginResponse);
        if (!artist) {
          this.errorService.error(
            { message: ERROR_MESSAGES.ONBOARD_ARTIST_ERROR },
            400
          );
        }
      }
      response.data["message"] = SUCCESS_MESSAGE.EMAIL_SENT_SUCCESS;
      return response.data;
    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.ONBOARD_ARTIST_ERROR, error);
      this.errorService.error({ message: error }, 400);
    }
  }

  async setPassword(input: setpasswordInput, isArtist: boolean) {
    try {
      if (!input.isTermsAgreed) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.USER_TERMS_AND_CONDITIONS },
          400
        );
      }
      const response = await this.authEngine.setPassword(
        input.password,
        isArtist,
        input.accessToken
      );
      /*Check user password. if set succesfully then set isEmail true.*/
      if (response.isOk) {
        if (isArtist) {
          let artistDetails = await this.ArtistModel.findOneAndUpdate(
            { userId: response._id },
            {
              $set: {
                isEmailVerified: true,
                isTermsAgreed: input.isTermsAgreed,
              },
            }
          );
          let artist = {
            userId: artistDetails?.userId,
            email: artistDetails?.email,
          };
          let data = {
            ArtistName: artistDetails?.name,
          };
          let organizerDetials = await this.organizerModel.findOne({
            userId: artistDetails?.organizer,
          });
          let organizer = {
            userId: organizerDetials?.userId,
            email: organizerDetials?.email,
          };
          let organizerData = {
            organizerName: organizerDetials?.name,
            artistName: artistDetails?.name,
          };
          this.notificationEngine.artsitWelcomeEmail(artist, data);
          this.notificationEngine.artistOnboarded(organizer, organizerData);
        } else {
          let advertiserDetails = await this.AdvertiserModel.findOneAndUpdate(
            { userId: response._id },
            {
              $set: {
                isEmailVerified: true,
                isTermsAgreed: input.isTermsAgreed,
              },
            }
          );
          if (!advertiserDetails) {
            return this.errorService.error({ message: "Invalid Token" }, 400);
          }
          let advertiser = {
            userId: advertiserDetails?.userId,
            email: advertiserDetails?.email,
          };
          let data = {
            advertiserName: advertiserDetails.name,
          };
          let organizerDetials = await this.organizerModel.findOne({
            userId: advertiserDetails.organizer,
          });
          let organizer = {
            userId: organizerDetials.userId,
            email: organizerDetials.email,
          };
          let organizerData = {
            organizerName: organizerDetials.name,
            advertiserName: advertiserDetails.name,
          };
          this.notificationEngine.advertiserwelcomeEmail(advertiser, data);
          this.notificationEngine.advertiserOnboarded(organizer, organizerData);
        }
      }

      this.loggingService.log(
        `${LOG_MESSAGES.UPDATE_PASSWORD_SUCCESS} ${JSON.stringify(input)}`
      );
      return response;
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.SET_PASSWORD_ERROR, error);
      this.errorService.error({ message: error }, 400);
    }
  }

  async checkEventDebate(event, details) {
    if (event.category === "Debate") {
      if (details.isMusicEnabled === true) {
        this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_MUSIC_ENABLE },
          400
        );
      }
      if (details.isMusicEnabled === true) {
        this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_MUSIC_ENABLE },
          400
        );
      }
      if (details.isVideoEnabled === true) {
        this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_VIDEO_ENABLE },
          400
        );
      }
      if (details.videoURL != null) {
        this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_VIDEO_URL },
          400
        );
      }
    }
  }

  async artistTrackValidation(input, loginResponse, tracks) {
    /*accessing by artist if not throw error.*/
    if (!loginResponse?.isArtist) {
      this.errorService.error(
        { message: ERROR_MESSAGES.USER_NOT_ARTIST_ERROR },
        400
      );
    }

    /*check if artist is there or not.*/
    const [isOwnerExist] = await this.ownershipModel.aggregate([
      {
        $match: {
          event: new ObjectId(input.eventId),
          ownerId: new ObjectId(loginResponse.artistId),
          type: ROLES.EVENT_ARTIST,
          isDeleted: false,
        },
      },
    ]);
    /*if not throw error*/
    if (!isOwnerExist) {
      this.errorService.error(
        { message: ERROR_MESSAGES.INVALID_EVENT_ID },
        400
      );
    }
    // if (tracks && !isOwnerExist[0].isMusicEnabled) {
    //   this.errorService.error({ message: ERROR_MESSAGES.ENABLE_MUSIC }, 400);
    // }
  }

  async uploadArtistTracks(input, loginResponse) {
    try {
      /*artist validation check.*/
      const [isEventExist] = await this.eventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(input.eventId),
            isDeleted: false,
            tatus: { $ne: [EVENT_STATUS.NEW, EVENT_STATUS.DRAFT] }
          },
        },
        {
          $lookup: {
            from: "eventcategories",
            localField: "category",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  eventCategory: 1,
                  _id: 0
                }
              }
            ],
            as: "eventCategory"
          }
        },
        {
          $project: {
            _id: 0,
            startDate: 1,
            endDate: 1,
            eventName: 1,
            duration: 1,
            eventStatus: 1,
            status: 1,
            category: { $arrayElemAt: ["$eventCategory.eventCategory", 0] }
          },
        },
      ]);
      await checkEventStatusBeforeAddingDetails(isEventExist)
      await this.artistTrackValidation(input, loginResponse, true);
      if (isEventExist.category === "Debate") {
        this.errorService.error({ message: ERROR_MESSAGES.INVALID_TRACKS_UPLOAD }, 400);
      }
      /*converting id to OnjectId's*/
      input.artistTrack.forEach((asset) => {
        asset._id = new ObjectId(asset._id);
      });

      /*get existing track details for implement ranking. { if existing track : rank + 1, else: rank = 1 }*/
      const existingTracks = await this.ownershipModel.aggregate([
        {
          $match: {
            type: ROLES.EVENT_ARTIST,
            event: new ObjectId(input?.eventId),
            ownerId: new ObjectId(loginResponse.artistId),
            isDeleted: false,
          },
        },
        {
          $unwind: "$artistTrack", // Deconstruct the artistTrack array
        },
        {
          $sort: { "artistTrack.rank": 1 }, // Sort by 'rank' field in ascending order
        },
        {
          $group: {
            _id: "$_id", // Group by the document ID or any suitable identifier
            artistTrack: { $push: "$artistTrack" }, // Reconstruct the artistTrack array
            name: { $first: "$name" }, // Preserve the 'name' field (assuming it's not part of the array)
            // You can include other fields here if needed
          },
        },
      ]);

      /*check if previous id's found if found then return error.*/
      let shouldUpdate = true;
      if (existingTracks.length && existingTracks[0].artistTrack.length) {
        /*check if existing trackids has there any new track id. */
        const isEveryTrackId = {
          existingTracks: existingTracks[0].artistTrack.map((id) =>
            id._id.toString()
          ),
          newTracks: input.artistTrack.map((id) => id._id.toString()),
        };
        shouldUpdate = !isEveryTrackId.newTracks.every((element) =>
          isEveryTrackId.existingTracks.includes(element)
        );
      }
      if (!shouldUpdate) {
        return {
          isOk: false,
          message: SUCCESS_MESSAGE.TRACK_ALREADY_EXIST,
        };
      }

      /*Implementing ranking */
      let startingRank = 1;
      if (existingTracks.length && existingTracks[0].artistTrack.length > 0) {
        const lastTrack =
          existingTracks[0].artistTrack[
          existingTracks[0].artistTrack.length - 1
          ];
        startingRank = lastTrack.rank + 1;
      }

      /*continuing the rank for each and every track.*/
      input.artistTrack.forEach((asset, index) => {
        asset.rank = startingRank + index;
      });

      const response = await this.ownershipModel
        .updateMany(
          {
            type: ROLES.EVENT_ARTIST,
            event: new ObjectId(input?.eventId),
            ownerId: new ObjectId(loginResponse.artistId),
            isDeleted: false,
          },
          {
            $addToSet: {
              artistTrack: { $each: input?.artistTrack },
            },
          },
          {
            new: true,
          }
        )
        .then(() =>
          this.ownershipModel.find({
            type: ROLES.EVENT_ARTIST,
            event: new ObjectId(input?.eventId),
            ownerId: new ObjectId(loginResponse.artistId),
            isDeleted: false,
          })
        );
      this.kafkaService.sendMessage(this.config.getKafkaTopic("FILE_BANNER"), {
        type: ROLES.EVENT_ARTIST,
        isOrganizer: false,
        event: input.eventId,
        data: {
          ownerAssets: [],
          ownerId: loginResponse.artistId,
          artistTracks: response[0]?.artistTrack,
        },
      });
      if (!loginResponse?.isOrganizer) {
        await this.venueService.updateArtistAdvertiserProgress(
          input,
          loginResponse
        );
      }

      if (response) {
        return {
          isOk: true,
          message: SUCCESS_MESSAGE.ARTIST_TRACKS_UPDATED_SUCCESSFULLY,
        };
      } else {
        return {
          isOk: false,
          message: SUCCESS_MESSAGE.ARTIST_TRACKS_ALREADY_UPDATED,
        };
      }
    } catch (error) {
      this.loggingService.error(
        ERROR_MESSAGES.ERROR_UPLOADING_ARTIST_TRACKS,
        error
      );
      this.errorService.error({ message: error.message }, 400);
    }
  }

  async getArtistTracks(input, loginResponse) {
    try {
      /*artist validation check.*/
      await this.artistTrackValidation(input, loginResponse, true);

      /*if eventid return artist tracks.*/
      const response = await this.ownershipModel.aggregate([
        {
          $match: {
            type: ROLES.EVENT_ARTIST,
            event: new ObjectId(input?.eventId),
            ownerId: new ObjectId(loginResponse.artistId),
            isDeleted: false,
          },
        },
        {
          $unwind: "$artistTrack", // Deconstruct the artistTrack array
        },
        {
          $sort: { "artistTrack.rank": 1 }, // Sort by 'rank' field in ascending order
        },
        {
          $group: {
            _id: "$_id", // Group by the document ID or any suitable identifier
            artistTrack: { $push: "$artistTrack" }, // Reconstruct the artistTrack array
            name: { $first: "$name" }, // Preserve the 'name' field (assuming it's not part of the array)
            // You can include other fields here if needed
          },
        },
        {
          $project: {
            _id: 1,
            artistTrack: 1,
            name: 1,
          },
        },
      ]);

      /*if response presign url and send back to response.*/
      if (response.length) {
        response.forEach((item) => {
          item.artistTrack = item.artistTrack.map((asset) => ({
            ...asset,
            link: this.venueService.generatePresignedUrl(asset.link),
          }));
        });
      }

      return response;
    } catch (error) {
      this.loggingService.error(
        ERROR_MESSAGES.ERROR_RETRIEVING_ARTIST_TRACKS,
        error
      );
      this.errorService.error({ message: error.message }, 400);
    }
  }

  async deleteArtistTracks(input, loginResponse) {
    try {
      /*check artist eventid is there or not.*/
      const [isEventExist] = await this.eventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(input.eventId),
            isDeleted: false,
            tatus: { $ne: [EVENT_STATUS.NEW, EVENT_STATUS.DRAFT] }
          },
        },
      ]);
      await checkEventStatusBeforeAddingDetails(isEventExist)
      await this.artistTrackValidation(input, loginResponse, true);
      /*if deleted send response.*/
      const response = await this.ownershipModel.findOneAndUpdate(
        {
          "artistTrack._id": new ObjectId(input.id),
          event: new ObjectId(input.eventId),
          ownerId: new ObjectId(loginResponse.artistId),
          isDeleted: false,
        },
        {
          $pull: {
            artistTrack: { _id: new ObjectId(input.id) },
          },
        },
        {
          new: true,
        }
      );
      if (!response) {
        this.errorService.error({ message: "Artist Track not found" }, 400)
      }
      if (
        !loginResponse?.isOrganizer &&
        response.artistTrack.length === 0 &&
        response.isMusicEnabled
      ) {
        await this.ownershipModel.updateOne(
          { _id: response._id },
          { $pull: { progress: { $in: ["UPLOADMUSIC"] } } },
          { new: true }
        );
      }
      /*if deleted modified then return success response.*/
      if (response) {
        this.kafkaService.sendMessage(
          this.config.getKafkaTopic("FILE_BANNER"),
          {
            type: ROLES.EVENT_ARTIST,
            isOrganizer: false,
            event: input.eventId,
            data: {
              ownerAssets: [],
              ownerId: loginResponse.artistId,
              artistTracks: response?.artistTrack,
            },
          }
        );
        return {
          isOk: true,
          message: SUCCESS_MESSAGE.ARTIST_TRACK_DELETED_SUCCESSFULLY,
        };
      } else {
        return {
          isOk: false,
          message: ERROR_MESSAGES.ARTIST_TRACK_NOT_FOUND,
        };
      }
    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.ERROR_DELETING_BANNER, error);
      this.errorService.error({ message: error.message }, 400);
    }
  }


  async organizeArtistTracks(input, loginResponse) {
    try {
      const [isEventExist] = await this.eventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(input.eventId),
            isDeleted: false,
            tatus: { $ne: [EVENT_STATUS.NEW, EVENT_STATUS.DRAFT] }
          },
        },
      ]);
      await checkEventStatusBeforeAddingDetails(isEventExist)
      const isArtistOwnerShip = await this.ownershipModel.aggregate([
        {
          $match: {
            event: new ObjectId(input.eventId),
            ownerId: new ObjectId(loginResponse?.artistId),
            isDeleted: false,
          },
        },
      ]);

      if (!isArtistOwnerShip.length) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.OWNERSHIP_NOT_FOUND,
          },
          400
        );
      }
      const isEveryIdExist = input.trackIds.every((id) =>
        isArtistOwnerShip[0].artistTrack
          .map((ele) => ele._id.toString())
          .includes(id)
      );

      if (
        !(input.trackIds.length === isArtistOwnerShip[0].artistTrack.length) ||
        !isEveryIdExist
      ) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.IDS_NOT_MATCHED,
          },
          400
        );
      }

      // Assuming input.trackIds is an array of ObjectIDs

      // Construct an array of update operations
      const bulkOperations = input.trackIds.map((trackId, idx) => ({
        updateOne: {
          filter: { "artistTrack._id": new ObjectId(trackId) },
          update: { $set: { "artistTrack.$.rank": idx + 1 } },
        },
      }));

      // Execute the bulk write operation
      const response = await this.ownershipModel.bulkWrite(bulkOperations);
      const result = await this.ownershipModel.find({
        event: new ObjectId(input.eventId),
        ownerId: new ObjectId(loginResponse?.artistId),
        isDeleted: false,
      });
      /*if updated modified then return success response.*/
      if (response.modifiedCount) {
        this.kafkaService.sendMessage(
          this.config.getKafkaTopic("FILE_BANNER"),
          {
            type: ROLES.EVENT_ARTIST,
            isOrganizer: false,
            event: input.eventId,
            data: {
              ownerAssets: [],
              ownerId: loginResponse.artistId,
              artistTracks: result[0]?.artistTrack,
            },
          }
        );

        return {
          isOk: true,
          message: SUCCESS_MESSAGE.ARTIST_TRACK_ORGANIZED_SUCCESSFULLY,
        };
      } else {
        return {
          isOk: false,
          message: ERROR_MESSAGES.FAILED_TO_ORGANIZE_TRACK,
        };
      }
    } catch (error) {
      this.loggingService.error(
        ERROR_MESSAGES.ERROR_RETRIEVING_ARTIST_TRACKS,
        error
      );
      this.errorService.error({ message: error.message }, 400);
    }
  }

  async setArtistPerformanceType(
    input: SetArtistPerformanceMode,
    loginResponse: any
  ) {
    try {
      let progress;
      await this.artistTrackValidation(input, loginResponse, false);
      const [isEventExist] = await this.eventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(input.eventId),
            isDeleted: false,
            status: { $ne: [EVENT_STATUS.NEW, EVENT_STATUS.DRAFT] }
          },
        },
        {
          $lookup: {
            from: "eventcategories",
            localField: "category",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  eventCategory: 1,
                  _id: 0
                }
              }
            ],
            as: "eventCategory"
          }
        },
        {
          $project: {
            _id: 0,
            startDate: 1,
            endDate: 1,
            duration: 1,
            eventStatus: 1,
            eventName: 1,
            status: 1,
            category: { $arrayElemAt: ["$eventCategory.eventCategory", 0] }
          },
        },
      ]);
      await checkEventStatusBeforeAddingDetails(isEventExist)
      let setDetails = {
        isMusicEnabled: Boolean(input.isMusicEnabled),
        isMicEnabled: Boolean(input.isMicEnabled),
        isVideoEnabled: Boolean(input.isVideoEnabled),
        videoURL: input.videoURL
      }
      await this.checkEventDebate(isEventExist, setDetails)
      if (!input.isVideoEnabled) {
        delete setDetails.videoURL
      }
      let details = await this.ownershipModel.findOneAndUpdate(
        {
          event: new ObjectId(input.eventId),
          ownerId: new ObjectId(loginResponse.artistId),
          type: ROLES.EVENT_ARTIST,
          isDeleted: false,
        },
        {
          $set: setDetails,
        },
        {
          new: true,
        }
      );
      if (
        (input.isMusicEnabled && details.artistTrack.length > 0) || (input.isVideoEnabled && input.videoURL) ||
        (input.isMicEnabled && !input.isMusicEnabled && !input.isVideoEnabled) ||
        (input.isMicEnabled &&
          input.isMusicEnabled &&
          details.artistTrack.length > 0) || (input.isMicEnabled &&
            input.isVideoEnabled && input.videoURL)
      ) {
        progress = {
          $addToSet: {
            progress: { $each: [ARTIST_PROGRESS.UPLOADMUSIC] },
          },
        };
      } else {
        progress = {
          $pull: {
            progress: {
              $in: [ARTIST_PROGRESS.UPLOADMUSIC],
            },
          },
        };
      }
      //updated progress
      await this.ownershipModel.updateOne(
        {
          event: new ObjectId(input.eventId),
          ownerId: new ObjectId(loginResponse.artistId),
          type: ROLES.EVENT_ARTIST,
          isDeleted: false,
        },
        progress
      );
      this.kafkaService.sendMessage(
        this.config.getKafkaTopic("ARTIST_PERFORMANCE_UPDATE"),
        {
          type: ROLES.EVENT_ARTIST,
          isOrganizer: false,
          event: input.eventId,
          data: {
            isMusicEnabled: details.isMusicEnabled,
            isMicEnabled: details.isMicEnabled,
            ownerId: loginResponse.artistId,
            videoURL: details.videoURL,
            isVideoEnabled: details.isVideoEnabled,
          },
        }
      );
      return {
        isMusicEnabled: details.isMusicEnabled,
        isMicEnabled: details.isMicEnabled,
        isVideoEnabled: details.isVideoEnabled,
        videoURL: details.videoURL,
        _id: details.event,
        name: details.eventName,
      };
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.SET_PASSWORD_ERROR, error);
      this.errorService.error({ message: error }, 400);
    }
  }

  async getArtistPerformanceType(input, loginResponse) {
    try {
      /*artist validation check.*/
      await this.artistTrackValidation(input, loginResponse, false);

      /*if eventid return artist tracks.*/
      const [response] = await this.ownershipModel.aggregate([
        {
          $match: {
            type: ROLES.EVENT_ARTIST,
            event: new ObjectId(input?.eventId),
            ownerId: new ObjectId(loginResponse.artistId),
            isDeleted: false,
          },
        },
        {
          $addFields: {
            artistTrack: {
              $cond: {
                if: {
                  $and: [
                    // { $eq: ["$isMusicEnabled", true] },
                    { $ne: [{ $size: "$artistTrack" }, 0] },
                  ],
                },
                then: {
                  $sortArray: {
                    input: "$artistTrack",
                    sortBy: { rank: 1 },
                  },
                },
                else: [],
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            artistTrack: 1,
            isMicEnabled: 1,
            isMusicEnabled: 1,
            name: "$eventName",
            isVideoEnabled: 1,
            videoURL: 1

          },
        },
      ]);
      /*if response presign url and send back to response.*/
      if (response) {
        response.artistTrack = response.artistTrack.map((asset) => ({
          ...asset,
          link: this.venueService.generatePresignedUrl(asset.link),
        }));
      }
      return response;
    } catch (error) {
      this.loggingService.error(
        ERROR_MESSAGES.ERROR_RETRIEVING_ARTIST_TRACKS,
        error
      );
      this.errorService.error({ message: error.message }, 400);
    }
  }

}
function getDatesBetween(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  currentDate.setUTCHours(0, 0, 0, 0);
  while (currentDate <= endDate) {
    // currentDate.setUTCHours(0, 0, 0, 0); // Set time to 12:00 AM
    dates.push(new Date(currentDate)); // Push a new Date object
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  return dates;
}

