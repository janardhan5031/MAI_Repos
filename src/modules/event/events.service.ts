import { EventsFilterInput } from "./../../common/shared/common.input_type";
import { HttpException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { LoggingService } from "src/common/logging/logging.service";
import { Event } from "../../common/database/entities/events.entity";
import { AddEventInput, EventSaleInput } from "./dto/event.input_type";
import { PaginationInput } from "src/common/shared/common.input_type";
import { Ticket } from "src/common/database/entities/ticket.entity";
import { EventCategory } from "src/common/database/entities/eventCategories";
import { Languages } from "src/common/database/entities/languages";
import { NotificationEngine } from "src/common/services/notification_engine";
import { ErrorService } from "src/common/services/errorService";
import { Slot } from "src/common/database/entities/slots.entity";
import { Advertiser } from "src/common/database/entities/advertiser.entity";
import { KafkaService } from "src/common/kafka/kafka.service";
import { Venue } from "src/common/database/entities/meta/venue.entity";
import { TimeConversionHelperService } from "src/common/helper/timezone";
import { Ownership } from "src/common/database/entities/meta/ownership.entity";
import { Artist } from "src/common/database/entities/artist.entity";
import { OnwershipService } from "src/common/services/ownershipService";
import { Organizer } from "src/common/database/entities/organizer.entity";
import { AuthEngine } from "src/common/services/auth_engine";
import { Vendor } from "src/common/database/entities/vendor.entity";
import { ConfigurationService } from "src/common/config/config.service";
import {
  ARTIST_PROGRESS,
  ERROR_MESSAGES,
  EVENT_STATUS,
  EventStatus,
  FORMAT_DATE,
  getArtistProgressBasedOnEventCategory,
  getOrganizerProgressBasedOnEventCategory,
  getOrganizerProgressBasedOnEventCategoryForPublish,
  INDEX_NAME,
  Initialstatus,
  KYC_STATUS,
  LOG_MESSAGES,
  PROGRESS_ORGANIZER,
  ROLES,
  SUCCESS_MESSAGE,
  VENDOR_PROGRESS,
} from "src/common/config/constants";
import { VendorEvent } from "src/common/database/entities/vendorEvent.entity";
import { Analytics } from "src/common/database/entities/analytics.entity";
import { eventNameToCamelCase, getEvents } from "src/common/helper/helper";
import axios from 'axios';
import * as csv from 'csvtojson';
import { AttendeesService } from "src/common/services/attendeesService";
const { ObjectId } = require("mongodb");
const moment = require("moment");
require("moment-timezone");


@Injectable()
export class EventService {
  ROLES: any;
  constructor(
    private readonly loggingService: LoggingService,
    private readonly authService: AuthEngine,
    private readonly attendeesService: AttendeesService,
    private readonly timeConversionServer: TimeConversionHelperService,
    private readonly errorService: ErrorService,
    private readonly notificationEngine: NotificationEngine,
    private readonly ownershipEngine: OnwershipService,
    @InjectModel(Event.name)
    private readonly EventModel: Model<Event>,
    @InjectModel(Languages.name)
    private readonly LanguageModel: Model<Languages>,
    @InjectModel(VendorEvent.name)
    private readonly vendorEventModel: Model<VendorEvent>,
    @InjectModel(EventCategory.name)
    private readonly EventCategoryModel: Model<EventCategory>,
    @InjectModel(Ticket.name)
    private readonly TicketModel: Model<Ticket>,
    @InjectModel(Venue.name)
    private readonly venueModel: Model<Venue>,
    @InjectModel(Analytics.name)
    private readonly analyticsModel: Model<Analytics>,
    @InjectModel(VendorEvent.name)
    private readonly vendoeEventModel: Model<VendorEvent>,
    @InjectModel(Slot.name)
    private readonly slotModel: Model<Slot>,
    @InjectModel(Organizer.name)
    private readonly organizerModel: Model<Organizer>,
    @InjectModel(Artist.name)
    private readonly artistModel: Model<Artist>,
    @InjectModel(Advertiser.name)
    private readonly advertiserModel: Model<Advertiser>,
    @InjectModel(Ownership.name)
    private readonly ownershipModel: Model<Ownership>,
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<Vendor>,
    private readonly kafkaService: KafkaService,
    private readonly config: ConfigurationService
  ) {
    this.ROLES = {
      EVENT_ARTIST: this.artistModel,
      EVENT_ADVERTISER: this.advertiserModel,
      EVENT_ORGANIZER: this.organizerModel,
      EVENT_VENDOR: this.vendorModel,
    };
  }

  async getEventOrganiser(eventId: any) {
    try {
      const event = await this.EventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId)
          }
        },
        {
          $lookup: {
            from: "organizers",
            foreignField: "_id",
            localField: "organizer",
            as: "organisers"
          }
        },
        {
          $unwind: '$organisers'
        },
        {
          $project: {
            _id: 0,
            organizerName: '$organisers.orgName'
          }
        }
      ])
      return event[0]?.organizerName;
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.ERROR_FETCHING_ORGANISER_NAME, error);
      return error;
    }
  }

  async createEvent(loginResponse: any, userTimeZone: string) {
    try {
      if (!loginResponse?.isOrganizer) {
        return new Error(ERROR_MESSAGES.NOT_AN_ORGANIZER);
      }
      const event = new this.EventModel();
      event["organizer"] = new ObjectId(loginResponse.userId);
      event["status"] = Initialstatus.NEW;
      event["progress"] = [];
      event["createdAt"] = new Date();
      await event.save();
      return { eventId: event._id };
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.ERROR_CREATING_EVENT, error);
      return error;
    }
  }
  async getOrganizerEvents(
    filterInput: EventsFilterInput,
    paginationInput: PaginationInput,
    loginResponse: any
  ) {
    try {
      let role;
      if (loginResponse.roles.includes(ROLES.EVENT_ORGANIZER)) {
        if (
          [
            EVENT_STATUS.LIVE,
            EVENT_STATUS.COMPLETED,
            EVENT_STATUS.UPCOMING,
            EVENT_STATUS.CANCELLED,
          ].includes(filterInput.status)
        ) {
          return {
            data: [],
            total: 0,
            filtered: 0,
          };
        }
        role = ROLES.EVENT_ORGANIZER;
      }
      // Get the user ID based on the role
      let userId = await this.organizerModel.findOne({
        userId: loginResponse._id,
      });
      // Define the initial match status for filtering events
      let { expr, matchStatus } = await getEvents(filterInput.status);
      matchStatus["organizer"] = new ObjectId(userId._id)
      let skip = paginationInput.skip >= 0 ? paginationInput.skip : 0;
      let limit = paginationInput.limit > 0 ? paginationInput.limit : 3;
      let pipeline = [];
      let search = {};
      // Perform search based on filterInput.name (org, Artist, Advertiser, Vendor Name)
      if (filterInput.name) {
        search = {
          $search: {
            index: "searchByEventName",
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
      let sort = { $sort: { "createdAt": -1 } };
      pipeline.push({
        $match: matchStatus
      })
      pipeline.push({
        $group: {
          _id: null,
          count: { $sum: 1 },
          events: { $push: "$$ROOT" }
        }
      })
      pipeline.push({
        $unwind: "$events"
      })
      pipeline.push({
        $addFields: {
          "events.totalCount": "$count"
        }
      })
      // Replace the root with the events
      pipeline.push({
        $replaceRoot: {
          newRoot: "$events"
        }
      });
      if (!filterInput.name) {
        pipeline.push(sort)
      }
      pipeline.push({ $skip: skip * limit })
      pipeline.push({ $limit: limit })
      pipeline.push({
        $lookup: {
          from: "slots",
          let: { eventId: "$_id", event_delete_status: "$isDeleted" },
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
          as: "slots",
        },
      },
        {
          $lookup: {
            from: "eventcategories",
            localField: "category",
            foreignField: "_id",
            pipeline: [{ $project: { eventCategory: 1, role: 1, _id: 1 } }],
            as: "category",
          }
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
          },
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
            "endTimeDate": {
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
                    "$endTime",
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
            formattedEndDate: {
              $add: [
                { $toDate: "$endDate" }, // Convert UTC date to ISODate
                { $multiply: ["$duration", 3600000] }, // Convert hours to milliseconds
              ],
            },
          },
        },
        {
          $addFields: {
            "artists": { $size: "$slots" },
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
          },
        },
      )
      // pipeline.push(addfield_customAvatar);s
      pipeline.push({
        $project: {
          saleStartDate: 0,
          saleEndDate: 0,
          transactionId: 0,
          price: 0,
          ticketPrice: 0,
          updatedAt: 0,
          tags: 0,
          languages: 0,
          slots: 0,
          ageLimit: 0,
          __v: 0,
          startTime: 0,
          endTime: 0,
          description: 0,
          progress: 0,
          isAgeRestricted: 0,
          isKycMandatory: 0
        }
      }
      )
      let events = await this.EventModel.aggregate(pipeline);
      return {
        data: events || [],
        total: events[0]?.totalCount || 0,
        filtered: events.length || 0,
      };

    } catch (error) {
      this.loggingService.error(
        LOG_MESSAGES.GETTING_ARTIST_DETAILS_ERROR,
        error
      );
      return error;
    }
  }

  async deleteEvent(eventId: string, loginResponse: any, userTimeZone: string) {
    try {
      if (!loginResponse?.isOrganizer) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.NOT_AN_ORGANIZER },
          401
        );
      }
      let event = await this.EventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
          },
        },
      ]);

      if (!event.length) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_EVENT_ID },
          401
        );
      } else if (
        ![EVENT_STATUS.DRAFT, EVENT_STATUS.NEW].includes(event[0].status)
      ) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.ALREADY_EVENT_CREATED },
          401
        );
      }
      if (!(event[0].organizer !== new ObjectId(loginResponse.userId))) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.UNAUTHORIZED_EVENT_DELETION },
          401
        );
      }

      event = await this.EventModel.findByIdAndDelete(eventId);
      if (event) {
        return {
          isOk: true,
          message: SUCCESS_MESSAGE.DELETED_SUCCESSFULLY,
          eventId: eventId,
        };
      }
      return this.errorService.error(
        { message: ERROR_MESSAGES.UNABLE_TO_DELETE_EVENT },
        400
      );
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.ERROR_CREATING_EVENT, error);
      return this.errorService.error({ message: `${error}` }, 400);
    }
  }

  async publishEvent(
    eventId: string,
    loginResponse: any,
    userTimeZone: string
  ) {
    try {
      if (!loginResponse?.isOrganizer) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.NOT_AN_ORGANIZER },
          401
        );
      }

      const event = await this.EventModel.aggregate([
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
                  _id: 1
                }
              }
            ],
            as: "category"
          }
        },
        {
          $addFields: {
            eventCategory: { $arrayElemAt: ["$category.eventCategory", 0] }
          },
        },
      ]);

      if (!event.length) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.INVALID_EVENT_ID,
          },
          400
        );
      } else if (
        event[0].status === EVENT_STATUS.PUBLISHED &&
        event[0]?.eventStatus
      ) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.ADDING_DETAILS_AFTER_SALE_START },
          400
        );
      } else if (event[0].status === EVENT_STATUS.PUBLISHED) {
        return {
          isOk: false,
          message: ERROR_MESSAGES.EVENT_ALREADY_PUBLISHED,
          eventId: eventId,
        };
      } else if (event[0].status != EVENT_STATUS.UNPUBLISHED) {
        return {
          isOk: false,
          message: ERROR_MESSAGES.UNABLE_TO_PUBLISH_EVENT_DRAFT,
          eventId: eventId,
        };
      }
      const dataToBeSentToAttendees = Object.assign({}, event[0]);

      const venueDetails = await this.venueModel.aggregate([
        {
          $match: { _id: event[0].venue },
        },
      ]);

      dataToBeSentToAttendees.venue = venueDetails[0].name;
      dataToBeSentToAttendees.seats = venueDetails[0].seats;

      const requiredProgress = getOrganizerProgressBasedOnEventCategoryForPublish(event[0].eventCategory)
      let artist = await this.ownershipModel.aggregate([
        {
          $match: {
            event: new ObjectId(eventId),
            type: ROLES.EVENT_ARTIST,
            isDeleted: false,
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            ownerId: 1,
            progress: 1
          },
        },
      ]);
      const eventProgress = event[0].progress;
      const missingProgress = requiredProgress.filter(
        (progress) => !eventProgress.includes(progress)
      );
      let owners = await this.ownershipModel.aggregate([
        {
          $match: {
            event: new ObjectId(eventId),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "organizers", // Use the dynamically set collectionName
            localField: "ownerId",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  isKYCVerified: false,
                  kycStatus: { $in: [KYC_STATUS.PENDING, KYC_STATUS.FAILED] },
                  isDeleted: false,
                },
              },
              { $project: { isKYCVerified: 1, _id: 0 } },
            ],
            as: "Organizer",
          },
        },
        {
          $lookup: {
            from: "artists",
            localField: "ownerId",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  isKYCVerified: false,
                  kycStatus: { $in: [KYC_STATUS.PENDING, KYC_STATUS.FAILED] },
                  isDeleted: false,
                },
              },
              { $project: { isKYCVerified: 1, _id: 0 } },
            ],
            as: "Artist",
          },
        },
        {
          $lookup: {
            from: "advertisers",
            localField: "ownerId",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  isKYCVerified: false,
                  kycStatus: { $in: [KYC_STATUS.PENDING, KYC_STATUS.FAILED] },
                  isDeleted: false,
                },
              },
              { $project: { isKYCVerified: 1, _id: 0 } },
            ],
            as: "Advertiser",
          },
        },
        {
          $lookup: {
            from: "vendors",
            localField: "ownerId",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  isKYCVerified: false,
                  kycStatus: { $in: [KYC_STATUS.PENDING, KYC_STATUS.FAILED] },
                  isDeleted: false,
                },
              },
              { $project: { isKYCVerified: 1, _id: 0 } },
            ],
            as: "Vendor",
          },
        },
        {
          $addFields: {
            commonIsKYCVerified: {
              $cond: {
                if: {
                  $or: [
                    { $ne: ["$Artist", []] },
                    { $ne: ["$Organizer", []] },
                    { $ne: ["$Advertiser", []] },
                    { $ne: ["$Vendor", []] },
                  ],
                },
                then: false,
                else: true,
              },
            },
          },
        },
        { $match: { commonIsKYCVerified: false } },
        { $project: { name: 1, type: 1, _id: 0 } },
      ]);
      await this.checkKYC(eventId, loginResponse.access_token);
      if (owners.length) {
        return this.errorService.error(
          {
            message: ERROR_MESSAGES.UNABLE_TO_PUBLISH_EVENT,
          },
          400
        );
      }

      if (missingProgress.length === 0) {
        let status = {
          status: EVENT_STATUS.PUBLISHED,
          eventStatus: null,
          saleStartDate: null,
          saleEndDate: null,
        }

        if (event[0].eventCategory === "Debate" && !artist[0].progress.includes(ARTIST_PROGRESS.CUSTOM_AVATAR)) {
          this.errorService.error({ message: `${artist[0].name} didn't add Avatar` }, 400)
        }
        else if (event[0].eventCategory === "Debate") {
          let [hours, minutes] = event[0].startTime.split(":").map(Number);
          let startDate = new Date(event[0].startDate);
          startDate.setUTCHours(hours + event[0].duration, minutes, 0, 0);
          status = {
            eventStatus: EVENT_STATUS.SALESTARTED,
            status: EVENT_STATUS.PUBLISHED,
            saleStartDate: new Date(),
            saleEndDate: event[0].endDate,
          }
          let res = await this.analyticsModel.findOne({
            eventId: new ObjectId(eventId),
            isDeleted: false,
          });
          if (!res) {
            await this.analyticsModel.create({
              eventId: new ObjectId(eventId),
              eventName: event[0].eventName,
              isDeleted: false,
              createdAt: new Date()
            });
          }
        }
        let eventUpdate = await this.EventModel.findOneAndUpdate(
          {
            _id: new ObjectId(eventId),
          },
          status,
          { new: true }
        );
        if (eventUpdate) {
          artist = artist.map((artist) => {
            return artist.ownerId ? artist.ownerId.toString() : "";
          });
          dataToBeSentToAttendees.status = EVENT_STATUS.PUBLISHED;
          dataToBeSentToAttendees.eventStatus = status.eventStatus;
          dataToBeSentToAttendees.saleStartDate = status.saleStartDate;
          dataToBeSentToAttendees.saleEndDate = status.saleEndDate;

          dataToBeSentToAttendees.artist = artist;
          dataToBeSentToAttendees["category"] = event[0].category[0]._id
          await this.kafkaService.sendMessage(
            this.config.getKafkaTopic("CREATE_EVENTS_TOPIC"),
            dataToBeSentToAttendees
          ); //sending event data to vendor panel
          if (event[0].eventCategory === "Debate") {
            this.csvInvite(loginResponse, event);
          }
          return {
            isOk: true,
            message: SUCCESS_MESSAGE.EVENT_PUBLISHED_SUCCESSFULLY,
            eventId: eventId,
          };
        }
        return this.errorService.error(
          { message: ERROR_MESSAGES.ERROR_PUBLISHING_EVENT },
          400
        );
      } else {
        return this.errorService.error(
          {
            message: `${ERROR_MESSAGES.EVENT_PUBLISHED_ERROR} ${missingProgress}`,
          },
          400
        );
      }
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.ERROR_CREATING_EVENT, error);
      return this.errorService.error({ message: `${error}` }, 400);
    }
  }

  async salecheckEvent(
    eventId: string,
    loginResponse: any,
    userTimeZone: string
  ) {
    try {
      if (!loginResponse?.isOrganizer) {
        this.errorService.error(
          { message: ERROR_MESSAGES.USER_NOT_ORGANISER },
          401
        );
      }
      const event = await this.EventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            isDeleted: false,
            organizer: new ObjectId(loginResponse?.userId),
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
                  _id: 1
                }
              }
            ],
            as: "category"
          }
        },
        {
          $addFields: {
            eventCategory: { $arrayElemAt: ["$category.eventCategory", 0] }
          },
        },
      ]);
      if (!event.length) {
        return this.errorService.error(
          {
            message: ERROR_MESSAGES.INVALID_EVENT_ID,
          },
          400
        );
      } else if (
        event[0].eventStatus &&
        event[0].eventStatus != EventStatus.SALESCHEDULED
      ) {
        this.errorService.error(
          { message: ERROR_MESSAGES.TICKET_SALE_ALREADY_STARTED },
          400
        );
      } else if (event[0].status !== EVENT_STATUS.PUBLISHED) {
        this.errorService.error({ message: ERROR_MESSAGES.PUBLISH_EVENT }, 400);
      } else if (event[0].status === EVENT_STATUS.DRAFT) {
        this.errorService.error(
          {
            message: `${ERROR_MESSAGES.EVENT_TICKET_SALE_STARTED} ${eventId}`,
          },
          400
        );
      }
      const requiredProgress = getOrganizerProgressBasedOnEventCategoryForPublish(event[0].eventCategory)
      const eventProgress = event[0].progress;
      const missingProgress = requiredProgress.filter(
        (progress) => !eventProgress.includes(progress)
      );

      let owners = await this.ownershipModel.aggregate([
        {
          $match: {
            event: new ObjectId(eventId),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "organizers", // Use the dynamically set collectionName
            localField: "ownerId",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  isKYCVerified: false,
                  kycStatus: { $in: [KYC_STATUS.PENDING, KYC_STATUS.FAILED] },
                  isDeleted: false,
                },
              },
              { $project: { isKYCVerified: 1, _id: 0 } },
            ],
            as: "Organizer",
          },
        },
        {
          $lookup: {
            from: "artists", // Use the dynamically set collectionName
            localField: "ownerId",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  isKYCVerified: false,
                  kycStatus: { $in: [KYC_STATUS.PENDING, KYC_STATUS.FAILED] },
                  isDeleted: false,
                },
              },
              { $project: { isKYCVerified: 1, _id: 0 } },
            ],
            as: "Artist",
          },
        },
        {
          $lookup: {
            from: "advertisers", // Use the dynamically set collectionName
            localField: "ownerId",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  isKYCVerified: false,
                  kycStatus: { $in: [KYC_STATUS.PENDING, KYC_STATUS.FAILED] },
                  isDeleted: false,
                },
              },
              { $project: { isKYCVerified: 1, _id: 0 } },
            ],
            as: "Advertiser",
          },
        },
        {
          $lookup: {
            from: "vendors", // Use the dynamically set collectionName
            localField: "ownerId",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  isKYCVerified: false,
                  kycStatus: { $in: [KYC_STATUS.PENDING, KYC_STATUS.FAILED] },
                  isDeleted: false,
                },
              },
              { $project: { isKYCVerified: 1, _id: 0 } },
            ],
            as: "Vendor",
          },
        },
        {
          $addFields: {
            commonIsKYCVerified: {
              $cond: {
                if: {
                  $or: [
                    { $ne: ["$Artist", []] },
                    { $ne: ["$Organizer", []] },
                    { $ne: ["$Advertiser", []] },
                    { $ne: ["$Vendor", []] },
                  ],
                },
                then: false,
                else: true,
              },
            },
          },
        },
        { $match: { commonIsKYCVerified: false } },
        { $project: { name: 1, type: 1, _id: 0 } },
      ]);
      if (owners.length) {
        return this.errorService.error(
          {
            message: ERROR_MESSAGES.UNABLE_TO_PUBLISH_EVENT,
          },
          400
        );
      }
      let progress = await this.ownershipModel.aggregate([
        {
          $match: {
            event: new ObjectId(eventId),
            isDeleted: false,
            type: { $nin: ["EVENT_ORGANIZER"] },
          },
        },
        {
          $addFields: {
            orgProgress: {
              $ifNull: ["$orgProgress", []],
            },
            progress: {
              $ifNull: ["$progress", []],
            },
          },
        },
        {
          $addFields: {
            status: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ["$type", ROLES.EVENT_ARTIST] },
                    then: {
                      $cond: {
                        if: {
                          $and: [
                            {
                              $or: [
                                {
                                  $in: [
                                    ARTIST_PROGRESS.UPLOADBANNER,
                                    "$progress",
                                  ],
                                },
                                {
                                  $in: [
                                    ARTIST_PROGRESS.UPLOADBANNER,
                                    "$orgProgress",
                                  ],
                                },
                              ],
                            },
                            {
                              $in: [
                                ARTIST_PROGRESS.ORGANIZEBANNER,
                                "$progress",
                              ],
                            },
                            { $in: [ARTIST_PROGRESS.UPLOADMUSIC, "$progress"] },
                            { $in: [ARTIST_PROGRESS.CUSTOM_AVATAR, "$progress"] },
                          ],
                        },
                        then: true,
                        else: {
                          $concat: [
                            "$name",
                            " ",
                            {
                              $cond: {
                                if: {
                                  $or: [
                                    {
                                      $in: [
                                        ARTIST_PROGRESS.UPLOADBANNER,
                                        "$progress",
                                      ],
                                    },
                                    {
                                      $in: [
                                        ARTIST_PROGRESS.UPLOADBANNER,
                                        "$orgProgress",
                                      ],
                                    },
                                  ],
                                },
                                then: "",
                                else: " didn't upload banners, ",
                              },
                            },
                            {
                              $cond: {
                                if: {
                                  $or: [
                                    {
                                      $in: [
                                        ARTIST_PROGRESS.ORGANIZEBANNER,
                                        "$progress",
                                      ],
                                    },
                                  ],
                                },
                                then: "",
                                else: "didn't organize banners, ",
                              },
                            },
                            {
                              $cond: {
                                if: {
                                  $in: [
                                    ARTIST_PROGRESS.UPLOADMUSIC,
                                    "$progress",
                                  ],
                                },
                                then: "",
                                else: " didn't upload music",
                              },
                            },
                            {
                              $cond: {
                                if: {
                                  $in: [
                                    ARTIST_PROGRESS.CUSTOM_AVATAR,
                                    "$progress",
                                  ],
                                },
                                then: "",
                                else: " didn't upload event avatar",
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                  {
                    case: { $eq: ["$type", ROLES.EVENT_ADVERTISER] },
                    then: {
                      $cond: {
                        if: {
                          $and: [
                            {
                              $or: [
                                {
                                  $in: [
                                    ARTIST_PROGRESS.UPLOADBANNER,
                                    "$progress",
                                  ],
                                },
                                {
                                  $in: [
                                    ARTIST_PROGRESS.UPLOADBANNER,
                                    "$orgProgress",
                                  ],
                                },
                              ],
                            },
                            {
                              $in: [
                                ARTIST_PROGRESS.ORGANIZEBANNER,
                                "$progress",
                              ],
                            },
                          ],
                        },
                        then: true,
                        else: {
                          $concat: [
                            "$name",
                            " ",
                            {
                              $cond: {
                                if: {
                                  $or: [
                                    {
                                      $in: [
                                        ARTIST_PROGRESS.UPLOADBANNER,
                                        "$progress",
                                      ],
                                    },
                                    {
                                      $in: [
                                        ARTIST_PROGRESS.UPLOADBANNER,
                                        "$orgProgress",
                                      ],
                                    },
                                  ],
                                },
                                then: "",
                                else: " didn't upload banners, ",
                              },
                            },
                            {
                              $cond: {
                                if: {
                                  $or: [
                                    {
                                      $in: [
                                        ARTIST_PROGRESS.ORGANIZEBANNER,
                                        "$progress",
                                      ],
                                    },
                                  ],
                                },
                                then: "",
                                else: "didn't organize banners, ",
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                  {
                    case: { $eq: ["$type", ROLES.EVENT_VENDOR] },
                    then: {
                      $cond: {
                        if: {
                          $and: [
                            {
                              $or: [
                                {
                                  $in: [
                                    VENDOR_PROGRESS.UPLOADBANNER,
                                    "$progress",
                                  ],
                                },
                                {
                                  $in: [
                                    VENDOR_PROGRESS.UPLOADBANNER,
                                    "$orgProgress",
                                  ],
                                },
                              ],
                            },
                            {
                              $setIsSubset: [
                                [
                                  VENDOR_PROGRESS.ASSIGNEDPRODUCTS,
                                  VENDOR_PROGRESS.ORGANIZEBANNER,
                                ],
                                "$progress",
                              ],
                            },
                          ],
                        },
                        then: true,
                        else: {
                          $concat: [
                            "$name",
                            " ",
                            {
                              $cond: {
                                if: {
                                  $or: [
                                    {
                                      $in: [
                                        VENDOR_PROGRESS.UPLOADBANNER,
                                        "$progress",
                                      ],
                                    },
                                    {
                                      $in: [
                                        VENDOR_PROGRESS.UPLOADBANNER,
                                        "$orgProgress",
                                      ],
                                    },
                                  ],
                                },
                                then: "",
                                else: "didn't upload banners, ",
                              },
                            },
                            {
                              $cond: {
                                if: {
                                  $in: [
                                    VENDOR_PROGRESS.ORGANIZEBANNER,
                                    "$progress",
                                  ],
                                },
                                then: "",
                                else: "didn't organize banners, ",
                              },
                            },
                            {
                              $cond: {
                                if: {
                                  $in: [
                                    VENDOR_PROGRESS.ASSIGNEDPRODUCTS,
                                    "$progress",
                                  ],
                                },
                                then: "",
                                else: "didn't organize products",
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
                default: "Unknown type",
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            trueCount: {
              $sum: {
                $cond: { if: { $eq: ["$status", true] }, then: 1, else: 0 },
              },
            },
            ownership: { $push: "$$ROOT" },
            artistMessages: {
              $push: {
                $cond: {
                  if: { $eq: ["$type", ROLES.EVENT_ARTIST] },
                  then: "$status",
                  else: null,
                },
              },
            },
            advertiserMessages: {
              $push: {
                $cond: {
                  if: { $eq: ["$type", ROLES.EVENT_ADVERTISER] },
                  then: "$status",
                  else: null,
                },
              },
            },
            vendorMessages: {
              $push: {
                $cond: {
                  if: { $eq: ["$type", ROLES.EVENT_VENDOR] },
                  then: "$status",
                  else: null,
                },
              },
            },
          },
        },
        {
          $project: {
            result: {
              $cond: {
                if: { $eq: ["$totalCount", "$trueCount"] },
                then: true,
                else: {
                  artistMessages: {
                    $filter: {
                      input: "$artistMessages",
                      as: "message",
                      cond: {
                        $and: [
                          { $ne: ["$$message", null] },
                          { $ne: ["$$message", true] },
                        ],
                      },
                    },
                  },
                  advertiserMessages: {
                    $filter: {
                      input: "$advertiserMessages",
                      as: "message",
                      cond: {
                        $and: [
                          { $ne: ["$$message", null] },
                          { $ne: ["$$message", true] },
                        ],
                      },
                    },
                  },
                  vendorMessages: {
                    $filter: {
                      input: "$vendorMessages",
                      as: "message",
                      cond: {
                        $and: [
                          { $ne: ["$$message", null] },
                          { $ne: ["$$message", true] },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ]);
      if (progress[0]?.result != true) {
        throw this.errorService.error(
          { message: JSON.stringify(progress[0]?.result) },
          400
        );
      }
      await this.checkKYC(eventId, loginResponse.access_token);
      if (owners.length) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.UNABLE_TO_PUBLISH_EVENT,
          },
          400
        );
      }
      if (missingProgress.length === 0) {
        return {
          isOk: true,
          eventId: eventId,
        };
      } else {
        this.errorService.error(
          {
            message: `${ERROR_MESSAGES.UNABLE_TO_SCHEDULE_EVENT} ${missingProgress}`,
          },
          400
        );
      }
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.ERROR_CREATING_EVENT, error);
      this.errorService.error({ message: error }, 400);
    }
  }

  async saleEvent(
    eventId: string,
    saleInput: EventSaleInput,
    loginResponse: any,
    userTimeZone: string
  ) {
    try {
      if (!loginResponse?.isOrganizer) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_ACCESS_FOR_USER },
          401
        );
      }
      await this.salecheckEvent(eventId, loginResponse, userTimeZone);
      const event = await this.EventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            organizer: new ObjectId(loginResponse?.userId),
            isDeleted: false,
          },
        },
      ]);
      if (!event.length) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.UNAUTHORIZED_TO_START_TICKET_SALE },
          401
        );
      } else if (
        event[0].eventStatus &&
        event[0].eventStatus != EventStatus.SALESCHEDULED
      ) {
        return {
          isOk: false,
          message: ERROR_MESSAGES.TICKET_SALE_ALREADY_STARTED,
          eventId: eventId,
        };
      } else if (event[0].status !== EVENT_STATUS.PUBLISHED) {
        return this.errorService.error(
          { message: `${ERROR_MESSAGES.PUBLISH_EVENT} ${eventId}` },
          400
        );
      } else if (event[0].status === Initialstatus.DRAFT) {
        return this.errorService.error(
          {
            message: `${eventId}`,
          },
          400
        );
      } else if (event[0].isDeleted) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.NO_EVENT_FOUND },
          400
        );
      }
      let saleDate = new Date(saleInput.startDate)
      const startDateObject = moment(
        saleDate,
        "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ"
      );
      const formattedStartDate = startDateObject.format("YYYY/MM/DD");
      const combinedStartDateTimeString = `${formattedStartDate} ${saleInput.startTime}`;
      const localStartDateTime = moment.tz(
        combinedStartDateTimeString,
        "YYYY/MM/DD HH:mm:ss",
        userTimeZone
      );
      let startDate = new Date(localStartDateTime.utc());
      let [hours, minutes] = event[0].startTime.split(":").map(Number);
      let endDate = new Date(event[0].endDate);
      endDate.setUTCHours(hours + event[0].duration, minutes, 0, 0);

      const currentDate = new Date();
      currentDate.setUTCSeconds(0);
      currentDate.setUTCMilliseconds(0);
      if (startDate > endDate) {
        return this.errorService.error(
          {
            message: ERROR_MESSAGES.UNABLE_TO_SALE_START,
          },
          400
        );
      }
      if (startDate.getTime() !== currentDate.getTime()) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.START_DATE_TIME_ERROR },
          400
        );
      }

      if (
        event[0].eventStatus &&
        event[0].eventStatus != EventStatus.SALESCHEDULED
      ) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.TICKET_SALE_ALREADY_STARTED },
          400
        );
      }
      if (
        event[0].status === EVENT_STATUS.PUBLISHED &&
        [null, EventStatus.SALESCHEDULED].includes(event[0].eventStatus)
      ) {
        let eventUpdate = await this.EventModel.findOneAndUpdate(
          {
            _id: new ObjectId(eventId),
          },
          {
            saleStartDate: startDate,
            saleEndDate: endDate,
            eventStatus: EVENT_STATUS.SALESTARTED,
          },
          { new: true, upsert: true }
        );
        if (eventUpdate) {
          this.kafkaService.sendMessage(
            this.config.getKafkaTopic("START_END_SALE"),
            {
              isSaleStarted: true,
              eventDetails: [
                {
                  _id: eventId,
                  saleStartDate: startDate,
                  saleEndDate: endDate,
                },
              ],
            }
          ); //Sale Started event data sent to attendees.
          let res = await this.analyticsModel.findOne({
            eventId: new ObjectId(eventId),
            isDeleted: false,
          });
          if (!res) {
            await this.analyticsModel.create({
              eventId: new ObjectId(eventId),
              eventName: eventUpdate.eventName,
              isDeleted: false,
              createdAt: new Date()
            });
          }
          let organizer = {
            userId: loginResponse?._id,
            email: loginResponse?.email,
          };
          let data = {
            organizerName: loginResponse?.preferred_name,
            eventName: eventUpdate?.eventName,
            startDate: moment.utc(eventUpdate.startDate).format("YYYY-MM-DD"),
            startTime: eventUpdate.startTime + " " + "GMT",
            endTime: eventUpdate.endTime + " " + "GMT",
          };

          this.notificationEngine.eventTicketSaleStart(organizer, data);
          if (event[0].isPrivate) {
            this.csvInvite(loginResponse, event);
          }
          return {
            isOk: true,
            message: LOG_MESSAGES.EVENT_SALE_STARTED_SUCCESSFULLY,
            eventId: eventId,
          };
        }
        return this.errorService.error(
          { message: ERROR_MESSAGES.SCHEDULE_TICKET_SALE_ERROR },
          400
        );
      } else {
        return {
          isOk: false,
          message: ERROR_MESSAGES.EVENT_SALE_UPDATE_ERROR,
          eventId: eventId,
        };
      }
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.ERROR_CREATING_EVENT, error);
      return this.errorService.error({ message: `${error}` }, 400);
    }
  }

  async scheduleEvent(
    eventId: string,
    saleInput: EventSaleInput,
    loginResponse: any,
    userTimeZone: string
  ) {
    try {
      if (!loginResponse?.isOrganizer) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_ACCESS_FOR_USER },
          401
        );
      }
      let response = await this.salecheckEvent(
        eventId,
        loginResponse,
        userTimeZone
      );
      const event = await this.EventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            organizer: new ObjectId(loginResponse?.userId),
          },
        },
      ]);

      if (!event.length) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.TICKET_SALE_START },
          401
        );
      } else if (
        !!event[0].eventStatus &&
        event[0].eventStatus != EventStatus.SALESCHEDULED
      ) {
        return {
          isOk: false,
          message: ERROR_MESSAGES.TICKET_SALE_ALREADY_STARTED,
          eventId: eventId,
        };
      } else if (event[0].status !== EVENT_STATUS.PUBLISHED) {
        return this.errorService.error(
          { message: `${ERROR_MESSAGES.PUBLISH_EVENT} ${eventId}` },
          400
        );
      } else if (event[0].status === "DRAFT") {
        return this.errorService.error(
          {
            message: `${ERROR_MESSAGES.EVENT_TICKET_SALE_STARTED} ${eventId}`,
          },
          400
        );
      } else if (event[0].isDeleted) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.NO_EVENT_FOUND },
          400
        );
      }
      let saleDate = new Date(saleInput.startDate)
      const startDateObject = moment(
        saleDate,
        "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ"
      );
      const formattedStartDate = startDateObject.format("YYYY/MM/DD");
      const combinedStartDateTimeString = `${formattedStartDate} ${saleInput.startTime}`;
      const localStartDateTime = moment.tz(
        combinedStartDateTimeString,
        "YYYY/MM/DD HH:mm:ss",
        userTimeZone
      );
      let eventStartDate = new Date(event[0].startDate);
      let [hours, minutes] = event[0].startTime.split(":").map(Number);
      let eventEndDate = new Date(event[0].endDate);
      eventStartDate.setUTCHours(hours, minutes, 0, 0);
      eventEndDate.setUTCHours(hours + event[0].duration, minutes, 0, 0);
      let startDate = new Date(localStartDateTime.utc());
      if (!(startDate < eventStartDate && startDate < eventEndDate)) {
        return this.errorService.error(
          {
            message: ERROR_MESSAGES.UNABLE_TO_SALE_START,
          },
          400
        );
      }
      const currentDate = new Date();
      currentDate.setUTCSeconds(0);
      currentDate.setUTCMilliseconds(0);
      if (startDate < currentDate) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.START_DATE_TIME_ERROR },
          400
        );
      }
      let endDate = new Date(event[0].endDate);
      endDate.setUTCHours(hours + event[0].duration, minutes, 0, 0);
      if (
        event[0].status === Initialstatus.PUBLISHED &&
        [null, EventStatus.SALESCHEDULED].includes(event[0].eventStatus)
      ) {
        let eventUpdate = await this.EventModel.findOneAndUpdate(
          {
            _id: new ObjectId(eventId),
          },
          {
            saleStartDate: startDate,
            saleEndDate: endDate,
            eventStatus: EVENT_STATUS.SALESCHEDULED,
          },
          { new: true, upsert: true }
        );
        this.kafkaService.sendMessage(
          this.config.getKafkaTopic("START_END_SALE"),
          {
            isSaleStarted: false,
            eventDetails: [
              {
                _id: eventId,
                saleStartDate: startDate,
                saleEndDate: endDate,
              },
            ],
          }
        );

        if (eventUpdate) {
          return {
            isOk: true,
            message: SUCCESS_MESSAGE.EVENT_SCHEDULED_SUCCESSFULLY,
            eventId: eventId,
          };
        }
        return this.errorService.error(
          { message: ERROR_MESSAGES.SCHEDULE_TICKET_SALE_ERROR },
          400
        );
      } else {
        return {
          isOk: false,
          message: ERROR_MESSAGES.EVENT_NOT_SCHEDULED,
          eventId: eventId,
        };
      }
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.ERROR_CREATING_EVENT, error);
      return this.errorService.error({ message: `${error}` }, 400);
    }
  }

  async updateEvent(
    eventId: String,
    AddEventInput: AddEventInput,
    loginResponse: any,
    userTimeZone: string
  ) {
    try {

      AddEventInput.eventName = (eventNameToCamelCase(AddEventInput.eventName)).trim()
      AddEventInput.eventName = AddEventInput.eventName.charAt(0).toUpperCase() + AddEventInput.eventName.slice(1);
      AddEventInput.description = AddEventInput.description
        .replace(/\s+/g, " ")
        .trim();
      AddEventInput["category"] = new ObjectId(AddEventInput.eventType);
      AddEventInput["updatedAt"] = new Date();
      AddEventInput.languages = AddEventInput.languages.map(
        (languageId) => new ObjectId(languageId)
      );
      if (!loginResponse?.isOrganizer) {
        return new Error(ERROR_MESSAGES.INVALID_ACCESS_FOR_CREATE_EVENT);
      }
      const isEventExist = await this.EventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            organizer: new ObjectId(loginResponse?.userId),
          },
        },
      ]);
      if (!isEventExist.length) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.INVALID_EVENT_ID,
          },
          400
        );
      }
      if (isEventExist[0]?.eventStatus) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.EVENT_DETAILS_NOT_UPDATED,
          },
          400
        );
      } else if (
        ["UNPUBLISHED", "PUBLISHED"].includes(isEventExist[0]?.status)
      ) {
        if (isEventExist[0].eventName.toLowerCase() != AddEventInput.eventName.toLowerCase()) {
          this.errorService.error(
            {
              message: ERROR_MESSAGES.RESTRICT_EVENT_NAME,
            },
            400
          );
        } else if (
          isEventExist[0].isAgeRestricted != AddEventInput.isAgeRestricted ||
          isEventExist[0].ageLimit != AddEventInput.ageLimit
        ) {
          this.errorService.error(
            {
              message: ERROR_MESSAGES.RESTRICT_AGE_RESTRICTION,
            },
            400
          );
        } else if (
          isEventExist[0].isKycMandatory != AddEventInput.isKycMandatory
        ) {
          this.errorService.error(
            {
              message: ERROR_MESSAGES.RESTRICT_KYC_MANDATORY,
            },
            400
          );
        }
        else if (
          isEventExist[0].isPrivate != AddEventInput.isPrivate
        ) {
          this.errorService.error(
            {
              message: ERROR_MESSAGES.RESTRICT_EVENT_STATE,
            },
            400
          );
        }

        else if (
          (isEventExist[0].category.toString()) != (AddEventInput.eventType)
        ) {
          this.errorService.error(
            {
              message: ERROR_MESSAGES.RESTRICT_EVENT_CATEGORY,
            },
            400
          );
        }
      }
      const [eventExists] = await this.EventModel.aggregate([
        {
          $match: {
            _id: { $ne: new ObjectId(eventId) },
            eventName: { $regex: `^${AddEventInput.eventName}$`, $options: 'i' },
            eventStatus: { $ne: EventStatus.COMPLETED },
            isDeleted: { $ne: true },
          },
        },
      ]);
      if (eventExists) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.DUPLICATE_EVENT_NAME,
          },
          400
        );
      }
      const isCategoryExist = await this.EventCategoryModel.aggregate([
        {
          $match: {
            _id: new ObjectId(AddEventInput.eventType),
            isDeleted: false,
          },
        },
      ]);
      if (!isCategoryExist.length) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.EVENT_TYPE_NOT_FOUND,
          },
          400
        );
      }
      if (isCategoryExist[0].eventCategory === "Debate" && !AddEventInput.isPrivate) {
        this.errorService.error({ message: "Event cannot be public for Debate events" }, 400);
      }
      if (AddEventInput.isPrivate && AddEventInput.isKycMandatory) {
        this.errorService.error({ message: "Private events cannot have KYC mandatory" }, 400);
      }
      if (!AddEventInput.isKycMandatory && AddEventInput.isAgeRestricted) {
        this.errorService.error({ message: "Without KYC, age restriction cannot be applied" }, 400);
      }

      if (AddEventInput?.languages) {
        await this.checkLanguages(AddEventInput);
      }
      if (AddEventInput?.isAgeRestricted && AddEventInput.ageLimit === null) {
        this.errorService.error({ message: "Age limit cannot be null " }, 400)
      }
      // update progress and status only for new event
      if (["NEW", "DRAFT"].includes(isEventExist[0].status)) {
        AddEventInput["status"] = Initialstatus.DRAFT;
        AddEventInput["progress"] = "DRAFT";
      }
      const event = await this.EventModel.findByIdAndUpdate(
        eventId,
        AddEventInput,
        { new: true }
      );
      let ownership_data = {
        ownerId: new ObjectId(event.organizer),
        event: new ObjectId(eventId),
        eventName: event.eventName,
        name:
          loginResponse.first_name +
          " " +
          loginResponse.last_name
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .trim(),
        type: "EVENT_ORGANIZER",
        assets: [],
        ownerAssets: [],
        artistTrack: [],
        timeSlot: [],
        isDeleted: false,
      };

      if (event.status == "DRAFT") {
        await this.ownershipEngine.addOwnership(ownership_data, userTimeZone);
      } else {
        this.kafkaService.sendMessage(
          this.config.getKafkaTopic("UPDATE_EVENTS_TOPIC"),
          {
            _id: event._id,
            isUpdated: true,
            languages: event.languages,
            isPrivate: event.isPrivate,
            category: event.category,
            description: event.description,
            coverPhoto: event.coverPhoto,
            thumbnail: event.thumbnail,
            tags: event.tags,
            status: event.status,
          }
        );
      }
      if (event) {
        return {
          _id: event._id,
          status: event.status,
          progress: event.progress,
          message: SUCCESS_MESSAGE.EVENT_UPDATED_SUCCESSFULL,
          isOk: true,
        };
      } else {
        return this.errorService.error(
          { message: ERROR_MESSAGES.EVENT_DETAILS_NOT_UPDATED },
          400
        );
      }
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.ERROR_CREATE_EVENT, error);
      return this.errorService.error({ message: `${error}` }, 400);
    }
  }

  async checkLanguages(input) {
    try {
      const languages = await this.LanguageModel.aggregate([
        {
          $match: {
            _id: {
              $in: input.languages.map((languageId) => {
                return new ObjectId(languageId);
              }),
            },
          },
        },
      ]);
      if (input?.languages?.length > languages?.length) {
        input.languages.forEach((_id) => {
          languages.forEach((language) => {
            if (language._id.toString() != _id) {
              throw new Error(`${ERROR_MESSAGES.LANGUAGE_NOT_FOUND} (${_id})`);
            }
          });
        });
      }
      if (!languages.length) {
        throw new Error(ERROR_MESSAGES.LANGUAGE_NOT_FOUND);
      }
    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.CHECKING_LANGUAGES, error);
      throw new Error(error.message);
    }
  }
  // get the event details
  async getEventById(
    eventId: string,
    loginResponse: any,
    userTimeZone: string
  ) {
    try {
      if (
        loginResponse
          ? ![
            ROLES.EVENT_ORGANIZER,
            ROLES.EVENT_ARTIST,
            ROLES.EVENT_ADVERTISER,
          ].includes(loginResponse.roles[0])
          : true
      ) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED_USER);
      }

      let owner, ownerId;
      const role = loginResponse.roles.find((role) => {
        return role in this.ROLES;
      });
      if (role) {
        owner = await this.ROLES[role].findOne({
          userId: loginResponse?._id,
        });
        ownerId = owner ? owner.id : "";
      }
      let pipeline = [];
      let match = {};
      let lookup_venue = {};
      let lookup_category = {};
      let lookup_languages = {};
      let lookup_slot = {};
      match = {
        $match: {
          $and: [
            { _id: new ObjectId(eventId) },
            {
              $or: [
                { status: "PUBLISHED" },
                {
                  $and: [
                    {
                      status: { $in: ["UNPUBLISHED", "DRAFT"] },
                      isDeleted: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      };
      lookup_venue = {
        $lookup: {
          from: "venues",
          localField: "venue",
          foreignField: "_id",
          pipeline: [
            {
              $addFields: {
                seats: "$userCount.max",
                stages: 1,
              },
            },
          ],
          as: "venue",
        },
      };
      lookup_category = {
        $lookup: {
          from: "eventcategories",
          localField: "category",
          foreignField: "_id",
          pipeline: [{ $project: { eventCategory: 1, role: 1, _id: 1 } }],
          as: "category",
        },
      };
      let category_unwind = {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
        },
      };
      let addfield_category = {
        $addFields: {
          category_name: "$category.eventCategory",
        },
      };
      lookup_languages = {
        $lookup: {
          from: "languages",
          localField: "languages",
          foreignField: "_id",
          pipeline: [{ $project: { language: 1, _id: 1 } }],
          as: "languages",
        },
      };
      let addFields_languages = {
        $addFields: {
          languages_name: "$languages.language",
        },
      };
      let vendor = {
        $lookup: {
          from: "vendorevents",
          localField: "_id",
          foreignField: "event",
          pipeline: [
            {
              $match: {
                isDeleted: false,
              },
            },
            {
              $lookup: {
                from: "vendors",
                localField: "vendor",
                foreignField: "_id",
                pipeline: [
                  { $project: { orgName: 1, isKYCVerified: 1, userId: 1 } },
                ],
                as: "vendor",
              },
            },
            {
              $lookup: {
                from: "metakiosks",
                localField: "activeKiosks",
                foreignField: "_id",
                pipeline: [
                  { $project: { kioskName: "$name", thumbnailUrl: 1, _id: 0 } },
                ],
                as: "kiosksList",
              },
            },

            {
              $unwind: {
                path: "$vendor",
                preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
              },
            },
            {
              $addFields: {
                orgName: "$vendor.orgName",
              },
            },
            {
              $addFields: {
                userId: "$vendor.userId",
              },
            },
            {
              $addFields: {
                isKYCVerified: "$vendor.isKYCVerified",
              },
            },
            { $addFields: { _id: "$vendor._id" } },

            { $match: { kiosksList: { $ne: [] } } },
            {
              $project: {
                kiosksList: 1,
                orgName: 1,
                isKYCVerified: 1,
                userId: 1,
              },
            },
          ],
          as: "vendors",
        },
      };
      let lookup_advertiser = {
        $lookup: {
          from: "ownerships",
          localField: "_id",
          foreignField: "event",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                type: "EVENT_ADVERTISER",
              },
            },
            {
              $lookup: {
                from: "advertisers",
                localField: "ownerId",
                foreignField: "_id",
                pipeline: [
                  { $project: { orgName: 1, isKYCVerified: 1, userId: 1 } },
                ],
                as: "ownerId",
              },
            },
            { $unwind: "$ownerId" },
            { $addFields: { userId: "$ownerId.userId" } },
            { $addFields: { orgName: "$ownerId.orgName" } },
            { $addFields: { isKYCVerified: "$ownerId.isKYCVerified" } },
            { $addFields: { _id: "$ownerId._id" } },
          ],
          as: "advertisers",
        },
      };
      lookup_slot = {
        $lookup: {
          from: "slots",
          let: { isDeleted: "$isDeleted", id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$isDeleted", "$$isDeleted"] },
                    { $eq: ["$eventId", "$$id"] },
                  ],
                },
              },
            },
            { $project: { createdAt: 0, updatedAt: 0, __v: 0 } },
            {
              $lookup: {
                from: "ownerships",
                let: {
                  eventId: "$eventId",
                  artistId: "$artistId",
                  isDeleted: "$isDeleted",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$event", "$$eventId"] },
                          { $eq: ["$isDeleted", "$$isDeleted"] },
                          { $eq: ["$ownerId", "$$artistId"] },
                          { $eq: ["$type", ROLES.EVENT_ARTIST] },
                        ],
                      },
                    },
                  },
                ],
                as: "owner",
              },
            },
            {
              $lookup: {
                from: "artists",
                localField: "artistId",
                foreignField: "_id",
                pipeline: [
                  {
                    $addFields: {
                      name: "$preferredName",
                    },
                  },
                  { $project: { createdAt: 0, updatedAt: 0, __v: 0 } },
                ],
                as: "artistId",
              },
            },
            {
              $unwind: "$artistId",
            },
            {
              $unwind: "$owner",
            },
          ],
          as: "slots", // Assign the "slots" array without the extra nesting
        },
      };
      let unwind_venue = {
        $unwind: {
          path: "$venue",
          preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
        },
      };

      let add_field = {};
      add_field = {
        $addFields: {
          ownerId: new ObjectId(ownerId),
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
          },
          endDate: {
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
          endTimeDate: {
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
                  "$endTime",
                  ":00.000Z",
                ],
              },
              format: "%Y-%m-%dT%H:%M:%S.%LZ",
            },
          },
          isFreeEntry: {
            $cond: {
              if: { $eq: [{ $type: "$ticketPrice" }, "missing"] },
              then: null,
              else: {
                $or: [{ $eq: ["$ticketPrice", 0] }],
              },
            },
          },
        },
      };
      let time_slot = {
        $lookup: {
          from: "ownerships",
          localField: "ownerId",
          foreignField: "ownerId",
          as: "timeSlots",
          pipeline: [
            {
              $match: {
                event: new ObjectId(eventId),
                isDeleted: false,
              },
            },
            {
              $project: {
                timeSlot: 1,
                _id: 0,
              },
            },
          ],
        },
      };
      let lookup_ownership = {
        $lookup: {
          from: "ownerships",
          let: { ownerId: ownerId, event: "$_id" }, // Use the _id field from the current collection
          pipeline: [
            {
              $match: {
                ownerId: new ObjectId(ownerId),
                event: new ObjectId(eventId),
                isDeleted: false,
              },
            },
            {
              $lookup: {
                from: "banners",
                let: { ownershipId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$owner", "$$ownershipId"] }, // Match the owner field with the _id
                          { $eq: ["$isDeleted", false] }, // Additional match condition for isDeleted
                        ],
                      },
                    },
                  },
                ],
                as: "banners",
              },
            },
            {
              $addFields: {
                bannersCount: {
                  $size: "$banners",
                },
              },
            },
            {
              $project: {
                _id: 0,
                bannersCount: 1,
              },
            },
          ],
          as: "ownerships",
        },
      };

      pipeline.push(add_field);
      pipeline.push(match);
      pipeline.push(lookup_category);
      pipeline.push(category_unwind);
      pipeline.push(addfield_category);
      pipeline.push(lookup_languages);
      pipeline.push(addFields_languages);
      pipeline.push(
        time_slot,
        {
          $unwind: "$timeSlots",
        },
        {
          $addFields: {
            timeSlots: "$timeSlots.timeSlot",
          },
        }
      );
      pipeline.push(lookup_advertiser);
      pipeline.push(lookup_venue);
      pipeline.push(unwind_venue);
      pipeline.push(vendor);
      pipeline.push(lookup_slot);

      if (
        [ROLES.EVENT_ARTIST, ROLES.EVENT_ADVERTISER].includes(
          loginResponse.roles[0]
        )
      ) {
        pipeline.push(lookup_ownership);
        pipeline.push({
          $addFields: {
            banners: {
              $arrayElemAt: ["$ownerships", 0],
            },
          },
        });
        pipeline.push({
          $addFields: {
            bannersCount: "$banners.bannersCount",
          },
        });
      }

      const event: any = await this.EventModel.aggregate(pipeline);
      if (!event.length) throw new Error(ERROR_MESSAGES.EVENT_ID_NOT_FOUND);
      if (event[0].status === "NEW")
        throw new Error(ERROR_MESSAGES.EVENT_ID_NOT_FOUND);
      return event[0];
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.UNABLE_TO_FETCH_EVENT_DETAILS, error);
      return error;
    }
  }
  async cancelEvent(
    eventId: String,
    isTermsAgreed: boolean,
    loginResponse: any,
    userTimeZone: string
  ) {
    try {
      //not authorize user to access the deletion.
      if (!loginResponse?.isOrganizer)
        return new Error(ERROR_MESSAGES.UNAUTHORIZED_USER);

      const event = await this.EventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            organizer: new ObjectId(loginResponse?.userId),
          },
        },
      ]);
      if (!event?.length)
        return this.errorService.error(
          { message: ERROR_MESSAGES.DELETE_EVENT_OWNER_ERROR },
          400
        );
      let organzer_status = await this.organizerModel.findByIdAndUpdate(
        event[0].organizer,
        { $set: { isTermsAgreed: isTermsAgreed } },
        { new: true }
      );
      if (!organzer_status?.isTermsAgreed) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.NOT_ACCEPTED_TA },
          400
        );
      } else if (event?.length && event[0].isDeleted) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.EVENT_CANCELLED },
          400
        );
      }
      if (!!event[0]?.eventStatus) {
        return this.errorService.error(
          {
            message: ERROR_MESSAGES.TICKET_SALE_NOT_STARTED,
          },
          400
        );
      }
      let result: any = {};
      let deletedAt = new Date();
      await this.EventModel.findOneAndUpdate(
        {
          _id: new ObjectId(eventId),
          organizer: new ObjectId(loginResponse?.userId),
        },
        {
          isDeleted: true,
          deletedAt: deletedAt,
        },
        { new: true, upsert: true }
      );
      await this.slotModel.updateMany(
        { eventId: new ObjectId(eventId), isDeleted: false },
        { isDeleted: true, deletedAt: deletedAt },
        { new: true }
      );
      await this.vendorEventModel.updateMany(
        { event: new ObjectId(eventId), isDeleted: false },
        { isDeleted: true, deletedAt: deletedAt },
        { new: true }
      );
      let ownership_data = {
        event: new ObjectId(eventId),
      };
      await this.ownershipEngine.deleteOwnershipsbyeventId(
        ownership_data,
        deletedAt,
        userTimeZone
      );
      result.isOk = true;
      result.message = SUCCESS_MESSAGE.EVENT_CANCELLED_SUCCESSFULLY;

      this.kafkaService.sendMessage(
        this.config.getKafkaTopic("UPDATE_EVENTS_TOPIC"),
        {
          _id: eventId,
          isDeleted: true,
        }
      );

      return result;
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.ERROR_DELETE_EVENT, error);
      return error;
    }
  }
  async checkKYC(eventId: string, accessToken: string) {
    try {
      let owners = await this.ownershipModel.find({
        event: new ObjectId(eventId),
        isDeleted: false,
      });
      await Promise.all(
        owners.map(async (ownership, index) => {
          let owner;
          const role = ownership.type;
          owner = await this.ROLES[role].findOne({
            _id: ownership.ownerId,
            isDeleted: false,
          });
          if (owner) {
            let response = await this.authService.kycStatusCheck(
              owner.email,
              accessToken
            );
            if (response.status) {
              await this.ROLES[role].findByIdAndUpdate(
                owner._id,
                {
                  isKYCVerified: response.is_kyc_completed,
                  kycStatus: response.status,
                },
                { new: true }
              );
            }
          }
          return true;
        })
      );
    } catch (error) {
      return this.errorService.error(
        {
          message: error,
        },
        400
      );
    }
  }

  async getProgress(eventId, loginResponse) {
    try {
      let response;
      if (loginResponse?.isOrganizer) {
        response = await this.EventModel.aggregate([
          {
            $match: { _id: new ObjectId(eventId), isDeleted: false },
          },
          {
            $project: {
              _id: 0,
              progress: 1,
            },
          },
        ]);
      } else {
        response = await this.ownershipModel.aggregate([
          {
            $match: {
              event: new ObjectId(eventId),
              isDeleted: false,
              ownerId: new ObjectId(
                loginResponse?.isAdvertiser
                  ? loginResponse?.advertiserId
                  : loginResponse?.artistId
              ),
            },
          },
          {
            $project: {
              _id: 0,
              progress: 1,
              orgProgress: {
                $cond: {
                  if: { $isArray: "$orgProgress" },
                  then: "$orgProgress",
                  else: [],
                },
              },
            },
          },
        ]);
      }
      return response.length ? response[0] : { progress: [], orgProgress: [] };
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.ERROR_CREATING_EVENT, error);
      return this.errorService.error({ message: `${error}` }, 400);
    }
  }
  async getEventCategoryProgress(eventId, loginResponse) {
    try {
      let response;
      if (loginResponse?.isOrganizer || loginResponse?.roles.includes(ROLES.EVENT_ARTIST)) {
        [response] = await this.EventModel.aggregate([
          {
            $match: {
              _id: new ObjectId(eventId),
              isDeleted: false
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
            $lookup: {
              from: "ownerships",
              localField: "_id",
              foreignField: "event",
              pipeline: [
                {
                  $match: {
                    ownerId: new ObjectId(loginResponse?.artistId),
                    isDeleted: false,
                  }
                }
              ],
              as: "owner"
            }
          },
          {
            $project: {
              _id: 0,
              ownerExists: { $cond: { if: { $gt: [{ $size: "$owner" }, 0] }, then: true, else: false } },
              category: { $arrayElemAt: ["$eventCategory.eventCategory", 0] }
            },
          },
        ]);
        if (response && loginResponse.isOrganizer) {
          return (getOrganizerProgressBasedOnEventCategory(response?.category))
        } else if (response && response?.ownerExists && loginResponse?.roles.includes(ROLES.EVENT_ARTIST)) {
          return (getArtistProgressBasedOnEventCategory(response?.category))
        }
      }
      return [];
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.ERROR_CREATING_EVENT, error);
      return this.errorService.error({ message: `${error}` }, 400);
    }
  }

  async updateProgress(eventId) {
    try {
      let ownership = await this.ownershipModel.aggregate([
        {
          $match: {
            isDeleted: false,
            event: new ObjectId(eventId),
            type: { $nin: [ROLES.EVENT_VENDOR, ROLES.EVENT_ORGANIZER] },
          },
        },
        {
          $lookup: {
            from: "banners",
            localField: "_id",
            foreignField: "owner",
            pipeline: [
              {
                $match: {
                  event: new ObjectId(eventId),
                  isDeleted: false,
                },
              },
            ],
            as: "banners",
          },
        },
        {
          $match: {
            banners: { $eq: [] }, // Check if at least one banner exists
          },
        },
      ]);
      if (ownership.length === 0) {
        await this.EventModel.findByIdAndUpdate(
          new ObjectId(eventId),
          {
            $addToSet: {
              progress: { $each: [PROGRESS_ORGANIZER.ASSIGNBANNER] },
            },
          },
          { new: true }
        );
      }

    } catch (error) {
      this.errorService.error({ message: ERROR_MESSAGES.DETAILS_UPDATE }, 400);
    }
  }

  async csvInvite(loginResponse: any, event: any) {
    try {
      const response = await axios.get(event[0]?.csv.csvLink);

      const csvLines = response.data.split('\n');
      const detectedHeaders = csvLines[0].split(',').map((header: any) => header.trim());

      let headerMapping = {};
      if (detectedHeaders.includes('Email Ids') && detectedHeaders.length === 1) {
        headerMapping['Email Ids'] = 'email';
      }
      else
        if (detectedHeaders.includes('Seat Numbers') && detectedHeaders.includes('Email Ids') && detectedHeaders.includes('Participant Type')) {
          headerMapping = {
            'Seat Numbers': 'seatNumber',
            'Email Ids': 'email',
            'Participant Type': 'type'
          };
        }

      const csvJson = await csv({
        noheader: false,
        headers: Object.keys(headerMapping),
        checkType: true,
        trim: true,
        ignoreEmpty: true
      })
        .fromString(response.data);

      let inviteDetails: any;
      if (headerMapping['email'] && !headerMapping['seatNumber']) {
        inviteDetails = csvJson.map((row: any) => ({
          email: row['Email Ids'] ? row['Email Ids'].toLowerCase() : null,
          eventName: event[0]?.eventName,
          eventDate: moment.utc(event[0]?.startDate).format(FORMAT_DATE.DATE_FORMAT),
          startTime: event[0]?.startTime,
          endTime: event[0]?.endTime,
          eventLink: `${process.env.ATTENDEE_FRONTEND_URL}/event?id=${event[0]._id}&isPrivate=true&email=${row['Email Ids']}`,
          link: `${process.env.ATTENDEE_FRONTEND_URL}`,
          userId: loginResponse._id,
        }));
      } else {
        inviteDetails = csvJson.map(row => ({
          email: row['Email Ids'] ? row['Email Ids'].toLowerCase() : null,
          seatNumber: row['Seat Numbers'] ? row['Seat Numbers'].toUpperCase() : null,
          type: row['Participant Type'] ? row['Participant Type'].toUpperCase() : null,
          eventName: event[0]?.eventName,
          eventDate: moment.utc(event[0]?.startDate).format(FORMAT_DATE.DATE_FORMAT),
          startTime: event[0]?.startTime,
          endTime: event[0]?.endTime,
          eventLink: `${process.env.ATTENDEE_FRONTEND_URL}/event?id=${event[0]._id}&isPrivate=true&email=${row['Email Ids']}&seatNumber=${row['Seat Numbers']}`,
          link: `${process.env.ATTENDEE_FRONTEND_URL}`,
          userId: loginResponse._id,
        }));
      }

      await this.notificationEngine.bulkEventInviteRequest(inviteDetails);
      const createPrivateTicketInput = inviteDetails.map((ticket: any) => {
        return {
          email: ticket.email,
          seatNumber: ticket.seatNumber ? ticket.seatNumber : null,
          type: ticket.type ? ticket.type : null,
        };
      });
      
      const data = {
        eventId: event[0]._id,
        createPrivateTicket: createPrivateTicketInput
      }
      this.kafkaService.sendMessage(this.config.getKafkaTopic("ADDED_PRIVATE_TICKET"), data)
      return inviteDetails;
    } catch (error) {
      this.loggingService.error(
        LOG_MESSAGES.ERROR_CREATING_PRIVATE_TICKET,
        error
      );
      return error;
    }
  }
}
