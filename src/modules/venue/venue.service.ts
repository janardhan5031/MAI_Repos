import { RedisHelperService } from "src/common/redis-helpers/redis-helper.service";
import { ErrorService } from "./../../common/services/errorService";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { LoggingService } from "src/common/logging/logging.service";
const { ObjectId } = require("mongodb");
import { Event } from "src/common/database/entities/events.entity";
import { checkSchedule } from "src/common/pipelines/mongo_pipelines";
import {
  EventDateInput,
  GetBannerInput,
  UploadBannerInput,
} from "../event/dto/event.input_type";
import { PaginationInput } from "src/common/shared/common.input_type";
import * as sharp from "sharp";
import { Banner } from "src/common/database/entities/banner.entity";
import { ConfigurationService } from "src/common/config/config.service";
import { Venue } from "src/common/database/entities/meta/venue.entity";
import { TimeConversionHelperService } from "src/common/helper/timezone";
import { Ownership } from "src/common/database/entities/meta/ownership.entity";
import { Organizer } from "src/common/database/entities/organizer.entity";
import { differenceInCalendarDays } from "date-fns";
import { NotificationEngine } from "src/common/services/notification_engine";
import { KafkaService } from "src/common/kafka/kafka.service";
import {
  ARTIST_PROGRESS,
  COMPRESSED_SIZE,
  ERROR_MESSAGES,
  EVENT_STATUS,
  FORMAT_DATE,
  Initialstatus,
  LOG_MESSAGES,
  PAYMENT_STATUS,
  ROLES,
  MEDIA_TYPE,
  SUCCESS_MESSAGE,
} from "src/common/config/constants";
import { StringListMemberString } from "aws-sdk/clients/ssmincidents";
import { PaymentEngine } from "src/common/services/paymentService";
import {
  convertTimeToMinutes,
  eventCheck,
  eventCheckbeforePayment,
  generateBlockVenueRedisKeys,
  getDatesInRange,
  getTimesInRange,
  getWorkingTimeSlots,
  mergeEventTimes,
  paymentCheck,
  venuePaymentIdGeneration,
} from "src/common/helper/helper";
import { LoginResponse } from "../auth/dto/auth.response";
import { utc } from "moment";
import { EventCategory } from "src/common/database/entities/eventCategories";
const AWS = require("aws-sdk");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const moment = require("moment");
require("moment-timezone");
@Injectable()
export class VenueService {
  private SKIP_PAYMENT: string;
  constructor(
    private readonly loggingService: LoggingService,
    private readonly paymentEngine: PaymentEngine,
    private readonly errorService: ErrorService,
    private readonly redisServer: RedisHelperService,
    private readonly notificationEngine: NotificationEngine,
    private readonly timeConversionServer: TimeConversionHelperService,
    private readonly kafkaService: KafkaService,
    @InjectModel(Event.name)
    private readonly EventModel: Model<Event>,
    @InjectModel(Organizer.name)
    private readonly organizerModel: Model<Organizer>,
    @InjectModel(Venue.name)
    private readonly VenueModel: Model<Venue>,
    @InjectModel(EventCategory.name)
    private readonly EventCategoryModel: Model<EventCategory>,
    @InjectModel(Banner.name)
    private readonly BannerModel: Model<Banner>,
    @InjectModel(Ownership.name)
    private readonly ownershipModel: Model<Ownership>,
    private readonly config: ConfigurationService
  ) {
    this.SKIP_PAYMENT = this.config.get("SKIP_PAYMENT");
  }

  async getVenues(
    eventDates: EventDateInput,
    pagination: PaginationInput,
    eventId: string,
    loginResponse: any,
    userTimeZone: any
  ) {
    try {
      if (!loginResponse.isOrganizer) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.NOT_AN_ORGANIZER },
          401
        );
      }
      let GPU = 3;
      let basePrice = 150;
      let venue_pipeline = [];
      let startDate: Date, endDate: Date, endDatewithstartTime: Date;
      let existingVenues;
      let [event] = await this.EventModel.aggregate([
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
                  venues: 1,
                  _id: 1
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
            duration: 1,
            eventName: 1,
            eventStatus: 1,
            status: 1,
            venueIds: { $arrayElemAt: ["$eventCategory.venues", 0] },
            category: { $arrayElemAt: ["$eventCategory._id", 0] },
            categoryName: { $arrayElemAt: ["$eventCategory.eventCategory", 0] }
          },
        },

      ]);
      //checks if event status is draft or not
      await eventCheck(event);
      // Pagination
      pagination.skip = pagination.skip >= 0 ? pagination.skip : 0;
      pagination.limit = pagination.limit > 0 ? pagination.limit : 3;
      //converts time to minutes
      const startTimeInMinutes = convertTimeToMinutes(eventDates.startTime);
      const endTimeInMinutes = convertTimeToMinutes(eventDates.endTime);
      if (startTimeInMinutes >= endTimeInMinutes) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.START_TIME_NOT_GREATER_THAN_END },
          400
        );
      }
      ({ startDate, endDate, endDatewithstartTime } =
        await this.timeConversionServer.timeConversation(
          eventDates,
          userTimeZone
        ));
      if (startDate > endDate) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.END_DATE_BEFORE_START_DATE },
          400
        );
      }
      // Calculate event hours
      const durationDifference: number =
        endDate.getTime() - endDatewithstartTime.getTime();
      const durationDifferenceInHours: number = Math.floor(
        durationDifference / 3600000
      );
      if (eventDates.duration != durationDifferenceInHours) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.DURATION_NOT_MATCHING },
          400
        );
      } else if (durationDifferenceInHours === 0) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.EVENT_DURATION_MINIMUM },
          400
        );
      }
      await this.timeConversionServer.validationEvent(
        startDate,
        endDatewithstartTime,
        eventDates.duration,
        userTimeZone
      );
      let eventDetails = {
        duration: eventDates.duration,
        organizer: loginResponse.userId,
        startDate: null,
        endDate: null,
        startTime: `${(startDate.getUTCHours() < 10 ? "0" : "") + startDate.getUTCHours()
          }:${(startDate.getUTCMinutes() < 10 ? "0" : "") +
          startDate.getUTCMinutes()
          }`,
        endTime: `${(endDate.getUTCHours() < 10 ? "0" : "") + endDate.getUTCHours()
          }:${(endDate.getUTCMinutes() < 10 ? "0" : "") + endDate.getUTCMinutes()
          }`,
      };
      startDate.setUTCHours(0, 0, 0, 0);
      startDate.setUTCMinutes(0);
      const differenceInDays =
        Math.abs(differenceInCalendarDays(startDate, endDatewithstartTime)) + 1;
      if (differenceInDays > 1 && event.categoryName === "Debate") {
        this.errorService.error({ message: "Debate event cannot be multiday" }, 400)
      }
      const eventHours = differenceInDays * durationDifferenceInHours;
      eventDetails.startDate = new Date(startDate);
      eventDetails.endDate = new Date(endDatewithstartTime);
      // get the event which are available for the current event
      let dates = JSON.parse(JSON.stringify(eventDetails))
      existingVenues = await this.venueExistance(dates, event.venueIds);
      existingVenues =
        existingVenues[0]?.venues?.length > 0 ? existingVenues[0]?.venues : [];
      /* Converting the user timezone to IST. */
      const getDatesRange = getDatesInRange(eventDetails.startDate, eventDetails.endDate);
      /* Get times in range. here if any timezone we need it in hours based so we are removing the two digits and addig :00 to it.*/
      const getTimesRange = await getTimesInRange(eventDetails.startTime, eventDetails.endTime);
      /* Generate redis keys. */
      // Check venue availability and add to existingVenues
      let [venue] = await this.EventCategoryModel.aggregate([{ $match: { _id: event.category } }, { $project: { venues: 1, _id: 0 } }]);
      venue = venue.venues
      await Promise.all(
        venue.map(async (data, index) => {
          let venueId: any = data._id;
          /* Generate redis keys. */
          const generatedRedisKeys = generateBlockVenueRedisKeys(venueId, getDatesRange, getTimesRange);
          /* Check the venue is blocked or not. */
          const checkVenueIsBlocked = await this.redisServer.checkVenueIsBlocked(generatedRedisKeys);
          /* If Blocked return error. */
          if (checkVenueIsBlocked?.success) {
            existingVenues.push(venueId);
          }
        })
      );
      let venueMatch = {
        $match: {
          _id: {
            $in: venue,
          },
        },
      };
      let venue_match = {
        $addFields: {
          isSold: {
            $in: ["$_id", existingVenues],
          },
        },
      };
      let add_venue_price = {
        $addFields: {
          venuePrice: {
            $round: [
              {
                $add: [
                  {
                    $multiply: [
                      { $divide: ["$userCount.max", 10] },
                      { $multiply: [GPU, eventHours] },
                    ],
                  },
                  basePrice,
                ],
              },
              2,
            ],
          },
          userCount: "$userCount.max",
          stages: 1,
        },
      };

      let perHour = {
        $addFields: {
          venuePriceperHour: {
            $round: [{ $divide: ["$venuePrice", eventHours] }, 2],
          },
        },
      };

      let facet = {
        $facet: {
          result: [
            { $skip: pagination.skip * pagination.limit },
            { $limit: pagination.limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      };
      venue_pipeline.push(venueMatch, venue_match);
      venue_pipeline.push(add_venue_price);
      venue_pipeline.push(perHour);
      venue_pipeline.push(facet);
      // get all the venues
      const venues = await this.VenueModel.aggregate(venue_pipeline);
      if (!venues?.length) {
        return {
          data: [],
          total: 0,
          filtered: 0,
        };
      }
      return {
        data: venues[0]?.result ? venues[0]?.result : [],
        total: venues[0]?.totalCount[0]?.count
          ? venues[0]?.totalCount[0]?.count
          : 0,
        filtered: venues[0]?.result?.length ? venues[0]?.result?.length : 0,
      };
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_FETCHING_VENUES, error);
      return this.errorService.error({ message: error }, 400);
    }
  }

  async generateReferenceNumber(
    eventDates: any,
    venueId: string,
    eventId: string,
    loginResponse,
    userTimeZone: string
  ) {
    try {
      let GPU = 3
      let basePrice = 150;
      let startDate: Date, endDate: Date, endDatewithstartTime: Date;
      //check if he is organizer or not
      if (!loginResponse.isOrganizer) {
        return new Error(ERROR_MESSAGES.NOT_AN_ORGANIZER);
      }
      // check if event id exists or not and organizer id matches
      let [event] = await this.EventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            organizer: new ObjectId(loginResponse?.userId),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "organizers",
            localField: "organizer",
            foreignField: "_id",
            pipeline: [{ $project: { isKYCVerified: 1, _id: 1 } }],
            as: "organizer",
          },
        },
        {
          $lookup: {
            from: "eventcategories",
            localField: "category",
            foreignField: "_id",
            pipeline: [
              { $project: { eventCategory: 1, venues: 1, _id: 0 } }],
            as: "category",
          }
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
          },
        },
      ]);
      //basic event checks & KYC Check
      await eventCheckbeforePayment(event, true, venueId);
      //terms and condition check check
      let organzer_status = await this.organizerModel.findByIdAndUpdate(
        event.organizer,
        { $set: { isTermsAgreed: eventDates.isTermsAgreed } },
        { new: true }
      );
      if (!organzer_status?.isTermsAgreed) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.USER_TERMS_AND_CONDITIONS },
          400
        );
      }
      //time check
      const startTimeInMinutes = convertTimeToMinutes(eventDates.startTime);
      const endTimeInMinutes = convertTimeToMinutes(eventDates.endTime);
      if (startTimeInMinutes >= endTimeInMinutes) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.START_TIME_NOT_GREATER_THAN_END },
          400
        );
      }
      //User Timezone to UTC
      ({ startDate, endDate, endDatewithstartTime } =
        await this.timeConversionServer.timeConversation(
          eventDates,
          userTimeZone
        ));
      //Dates check
      if (startDate > endDate) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.END_DATE_BEFORE_START_DATE },
          400
        );
      }

      const durationDifference: number =
        endDate.getTime() - endDatewithstartTime.getTime();
      const durationDifferenceInHours: number = durationDifference / 3600000;
      if (
        eventDates.duration != durationDifferenceInHours ||
        durationDifferenceInHours === 0
      ) {
        const errorMessage =
          durationDifferenceInHours === 0
            ? ERROR_MESSAGES.EVENT_DURATION_MINIMUM
            : ERROR_MESSAGES.DURATION_NOT_MATCHING;

        throw this.errorService.error({ message: errorMessage }, 400);
      }
      let eventDetails = {
        duration: eventDates.duration,
        organizer: loginResponse.userId,
        eventId: eventId,
        startDate,
        endDate: endDatewithstartTime,
        startTime: `${(startDate.getUTCHours() < 10 ? "0" : "") + startDate.getUTCHours()
          }:${(startDate.getUTCMinutes() < 10 ? "0" : "") +
          startDate.getUTCMinutes()
          }`,
        endTime: `${(endDate.getUTCHours() < 10 ? "0" : "") + endDate.getUTCHours()
          }:${(endDate.getUTCMinutes() < 10 ? "0" : "") + endDate.getUTCMinutes()
          }`,
      };
      await this.timeConversionServer.validationEvent(
        startDate,
        endDatewithstartTime,
        eventDates.duration,
        userTimeZone
      );
      startDate.setUTCHours(0, 0, 0, 0);
      startDate.setUTCMinutes(0);
      const differenceInDays =
        Math.abs(differenceInCalendarDays(startDate, endDatewithstartTime)) + 1;
      if (differenceInDays > 1 && event.category.eventCategory === "Debate") {
        this.errorService.error({ message: "Debate event cannot be multiday" }, 400)
      }
      const eventHours = differenceInDays * durationDifferenceInHours;
      let startTime = eventDetails.startTime
      let endTime = eventDetails.endTime
      let Venue_exists = await this.VenueModel.aggregate([
        {
          $match: {
            _id: new ObjectId(venueId),
          },
        }, {
          $addFields: {
            venuePrice: {
              $round: [
                {
                  $add: [
                    {
                      $multiply: [
                        { $divide: ["$userCount.max", 10] },
                        { $multiply: [GPU, eventHours] },
                      ],
                    },
                    basePrice,
                  ],
                },
                2,
              ],
            },
            userCount: "$userCount.max",
            stages: 1,
          },
        }, {
          $addFields: {
            venuePriceperHour: {
              $round: [{ $divide: ["$venuePrice", eventHours] }, 2],
            },
          },
        }
      ]);
      if (!Venue_exists.length) {

        this.errorService.error(
          { message: ERROR_MESSAGES.VENUE_ID_NOT_FOUND },
          400
        );
      }
      let dates = JSON.parse(JSON.stringify(eventDetails))
      // Check if any user has booked the venue for the provided dates (in db)
      let existingVenues = await this.venueExistance(dates, venueId);
      if (existingVenues.length) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.VENUE_BLOCKED_SAME_TIME },
          400
        );
      }
      /* Get dates in range. */
      const getDatesRange = getDatesInRange(eventDetails.startDate, eventDetails.endDate);
      /* Get times in range. here if any timezone we need it in hours based so we are removing the two digits and addig :00 to it.*/
      const getTimesRange = await getTimesInRange(eventDetails.startTime, eventDetails.endTime);
      /* Generate redis keys. */
      const generatedRedisKeys = generateBlockVenueRedisKeys(venueId, getDatesRange, getTimesRange);
      /* Check the venue is blocked or not. */
      const checkVenueIsBlocked = await this.redisServer.checkVenueIsBlocked(generatedRedisKeys);
      /* If Blocked return error. */
      if (checkVenueIsBlocked?.success) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.VENUE_BLOCKED_SAME_TIME },
          400
        );
      }

      /* Blocking the venue for some time. */
      await this.redisServer.blockVenueEvent(generatedRedisKeys, eventDetails.eventId);

      eventDetails["referenceNumber"] = await venuePaymentIdGeneration();
      eventDetails["venue"] = venueId;
      eventDetails["price"] = Venue_exists[0].venuePrice;
      let data = await this.redisServer.venuePaymentInfoforanEvent(
        eventId,
        eventDetails
      );
      return {
        referenceNumber: data.referenceNumber,
        price: data.price,
        eventId: data.eventId,
      };
    } catch (error) {
      this.loggingService.error(
        ERROR_MESSAGES.ERROR_INITIATING_VENUE_PAYMENT,
        error
      );
      this.errorService.error({ message: error.message }, 400);
    }
  }

  async validateTransaction(
    transactionId: string,
    eventId: StringListMemberString,
    loginResponse,
    paymentSkip
  ) {
    try {
      if (!loginResponse.isOrganizer) {
        return new Error(ERROR_MESSAGES.NOT_AN_ORGANIZER);
      }
      let [event] = await this.EventModel.aggregate([
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
            pipeline: [{ $project: { eventCategory: 1, _id: 1 } }],
            as: "category",
          },
        },
      ]);
      await eventCheckbeforePayment(event, false, null);
      let paymentDetails: any = await this.redisServer.getVenuePayment(eventId);
      if ((!paymentSkip || (paymentSkip === "false" || paymentSkip === false)) && this.SKIP_PAYMENT == "true") {
        const transactionDeatils = await this.paymentEngine.getTransaction(
          transactionId,
          loginResponse
        );
        await paymentCheck(paymentDetails, transactionDeatils);
      }
      let eventDetails = paymentDetails;
      if (!eventDetails) {
        return {
          eventId: eventId,
          status: "failed",
          message: "Payment transcation Failed",
        }
      }
      delete eventDetails?.organiser;
      eventDetails.startDate = new Date(paymentDetails?.startDate);
      eventDetails.endDate = new Date(paymentDetails?.endDate);
      eventDetails.venue = new ObjectId(eventDetails?.venue);
      let endDate = new Date(paymentDetails?.endDate);
      let existingVenues = await this.venueExistance(eventDetails, eventDetails.venue);
      eventDetails.endDate = new Date(endDate);
      eventDetails.startDate = new Date(paymentDetails?.startDate);
      let [Venue_exists] = await this.VenueModel.aggregate([
        {
          $match: {
            _id: new ObjectId(paymentDetails.venue),
          },
        },
      ]);
      if (existingVenues.length) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.VENUE_BLOCKED_SAME_TIME },
          400
        );
      }

      eventDetails["transactionId"] = transactionId;
      eventDetails["updatedAt"] = new Date();
      eventDetails["status"] = EVENT_STATUS.UNPUBLISHED;
      eventDetails.organizer
        ? (eventDetails.organizer = new ObjectId(eventDetails.organizer))
        : null;
      const updatedEvent = await this.EventModel.findOneAndUpdate(
        { _id: new ObjectId(eventId) },
        {
          $set: eventDetails,
          $addToSet: {
            progress: EVENT_STATUS.UNPUBLISHED,
          },
        },
        { new: true }
      ).lean();
      await this.redisServer.clearVenuePayment(eventId);
      let organizer = {
        userId: loginResponse?._id,
        email: loginResponse?.email,
      };
      let data = {
        organizerName:
          loginResponse.first_name +
          " " +
          loginResponse.last_name
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .trim(),
        eventName: updatedEvent.eventName,
        startDate: moment
          .utc(updatedEvent.startDate)
          .format(FORMAT_DATE.DATE_FORMAT),
        startTime: updatedEvent.startTime + " " + "GMT",
        endTime: updatedEvent.endTime + " " + "GMT",
        eventVenue: Venue_exists.name,
        eventCategory: event.category[0].eventCategory,
        eventDescription: updatedEvent.description,
      };
      let EventstartDate = new Date(updatedEvent.startDate);
      let [hours, minutes] = updatedEvent.startTime.split(":").map(Number);
      let EventendDate = new Date(updatedEvent.endDate);
      EventstartDate = new Date(
        EventstartDate.setUTCHours(hours, minutes, 0, 0)
      );
      EventendDate = new Date(
        EventendDate.setUTCHours(hours + updatedEvent.duration, minutes, 0, 0)
      );
      let ownership = await this.ownershipModel.findOneAndUpdate(
        {
          event: new ObjectId(eventId),
          type: ROLES.EVENT_ORGANIZER,
          isDeleted: false,
        },
        {
          timeSlot: [
            {
              startTime: EventstartDate,
              endTime: EventendDate,
            },
          ],
        },
        {
          new: true,
        }
      );
      this.kafkaService.sendMessage(
        this.config.getKafkaTopic("ADD_REMOVE_OWNERSHIP"),
        {
          isRemoved: false,
          result: ownership,
        }
      );
      //sending event data to vendor panel
      this.kafkaService.sendMessage(
        this.config.getKafkaTopic("CREATE_EVENTS_TOPIC"),
        updatedEvent
      );
      this.notificationEngine.eventCreationSuccess(organizer, data);
      return {
        eventId: updatedEvent._id,
        status: "success",
        message: SUCCESS_MESSAGE.PAYMENT_TRANSACTION_COMPLETED,
      };
    } catch (error) {
      const errorCode = error?.status || 400;
      this.errorService.error({ message: error }, errorCode);
      LoggingService.error(ERROR_MESSAGES.INITIATE_VENUE_PAYMENT_ERROR, error);
      return error;
    }
  }
  async getlatestDates(eventId: string, loginResponse: any, userTimeZone: string) {
    try {
      let currentDate = new Date();
      let freeSlotsNotExists = true
      let freeslots = []
      currentDate.setUTCDate(currentDate.getUTCDate() + 4);
      currentDate.setUTCHours(0, 0, 0, 0);
      let [event] = await this.EventModel.aggregate([{
        $match: {
          _id: new ObjectId(eventId)
        }
      },
      {
        $project: {
          _id: 1,
          category: 1,
          status: 1,
          eventStatus: 1
        }
      }])
      await eventCheck(event);
      let [venues] = await this.EventCategoryModel.aggregate([{ $match: { _id: event.category } }, { $project: { venues: 1, _id: 0 } }]);
      venues = venues.venues
      while (freeSlotsNotExists) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        currentDate.setUTCHours(0, 0, 0, 0);
        let timeRange = getWorkingTimeSlots(currentDate, userTimeZone)
        currentDate.setUTCHours(0, 0, 0, 0);
        ///find venue blocked duration on that day
        let events = await this.EventModel.aggregate([
          {
            $match: {
              isDeleted: false,
              status: { $nin: [EVENT_STATUS.NEW, EVENT_STATUS.DRAFT] },
              venue: { $in: venues }
            },
          },
          {
            $addFields: {
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
            },
          },
          {
            $addFields: {
              endDate: {
                $add: [
                  { $toDate: "$endDate" }, // Convert UTC date to ISODate
                  { $multiply: ["$duration", 3600000] }, // Convert hours to milliseconds
                ],
              },
            },
          },
          {
            $match: {
              $or: [
                {
                  $and: [
                    { startDate: { $lte: timeRange[0].startTime } },
                    { endDate: { $gte: timeRange[0].startTime } },
                  ],
                },
                {
                  $and: [
                    { startDate: { $lte: timeRange[0].endTime } },
                    {
                      endDate: {
                        $gte: timeRange[0].endTime
                      }
                    },
                  ],
                },
                {
                  $and: [
                    { startDate: { $gte: timeRange[0].startTime } },
                    { endDate: { $lte: timeRange[0].endTime } },
                  ],
                },
              ],
            },
          },
          {
            $project: {
              eventStatus: 1,
              duration: 1,
              startDate: 1,
              endDate: 1,
              venue: 1,
            },
          },
          {
            $group: {
              _id: "$venue",
              totalDuration: { $sum: "$duration" },
              events: { $push: "$$ROOT" },
            },
          },
        ]);
        venues.forEach(venueId => {
          if (!events.some(event => (event._id).toString() === (venueId._id).toString())) {
            events.push({
              _id: venueId._id,
              totalDuration: 0,
              events: []
            });
          }
        });
        async function findAvailableTimeSlots(events, timeRange, redisServer) {
          for (const venueSpecificEvents of events) {
            if (venueSpecificEvents.totalDuration < 23) {
              let availableTimeSlots = [...timeRange];
              const day = availableTimeSlots[0].startTime.getUTCDate()
              const month = availableTimeSlots[0].startTime.getUTCMonth() + 1; // Months are zero-indexed in JavaScript
              const year = availableTimeSlots[0].startTime.getUTCFullYear();
              const formattedDate = `${year}-${(month < 10 ? "0" : "") + month}-${(day < 10 ? "0" : "") + day}`;
              /* Get dates in range. */
              // Clone the timeRange array to avoid modifying the original
              const startTime = availableTimeSlots[0].startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
              const endTime = availableTimeSlots[0].endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
              const getDatesRange = [formattedDate]
              /* Get times in range. here if any timezone we need it in hours based so we are removing the two digits and addig :00 to it.*/
              const getTimesRange = getTimesInRange(startTime, endTime);
              /* Generate redis keys. */
              const generatedRedisKeys = generateBlockVenueRedisKeys(venueSpecificEvents._id, getDatesRange, getTimesRange);
              let data = await redisServer.checkVenueIsBlockedCount(generatedRedisKeys, userTimeZone);
              venueSpecificEvents.events.push(...data.blockedTimes)
              const mergedEvents = await mergeEventTimes(venueSpecificEvents.events);
              for (const event of mergedEvents) {
                availableTimeSlots = availableTimeSlots.reduce((result, slot) => {
                  const eventStart = new Date(event.startDate);
                  const eventEnd = new Date(event.endDate);
                  const slotStart = new Date(slot.startTime);
                  const slotEnd = new Date(slot.endTime);

                  if (eventStart > slotEnd) {
                    result.push(slot);
                  } else if (eventEnd < slotStart) {
                    result.push(slot);
                  } else {
                    if (eventStart > slotStart) {
                      result.push({
                        startTime: slot.startTime,
                        endTime: event.startDate,
                        duration: Number(((eventStart.getTime() - slotStart.getTime()) / (1000 * 60 * 60)).toFixed())
                      });
                    }
                    if (eventEnd < slotEnd) {
                      result.push({
                        startTime: event.endDate,
                        endTime: slot.endTime,
                        duration: Number(((slotEnd.getTime() - eventEnd.getTime()) / (1000 * 60 * 60)).toFixed())
                      });
                    }
                  }
                  return result;
                }, []);
              }
              if (availableTimeSlots.length > 0) {
                availableTimeSlots.sort((a, b) => (b.duration) - a.duration);
                availableTimeSlots.forEach((slot, index) => {
                  slot.venueId = venueSpecificEvents._id;
                });
                return availableTimeSlots
              }
            }
            else {
              return []
            }
          }
        }
        freeslots = await findAvailableTimeSlots(events, timeRange, this.redisServer);
        if (!freeslots?.length) {
          freeSlotsNotExists = true
        }
        else {
          freeSlotsNotExists = false
          if (freeslots[0].duration) {
            freeslots[0].startTime = moment.utc(freeslots[0].startTime).tz(userTimeZone);
            freeslots[0].endTime = moment.utc(freeslots[0].endTime).tz(userTimeZone);
            return {
              startDate: freeslots[0].startTime.format('YYYY-MM-DD'),
              startTime: freeslots[0].startTime.format('HH:mm'),
              endDate: freeslots[0].endTime.format('YYYY-MM-DD'),
              endTime: freeslots[0].endTime.format('HH:mm')
            };
          }
        }

      }
    }
    catch (e) {
      this.loggingService.log(`error in getting latest dates ${e}`)
      this.errorService.error({ message: e }, 400
      )
    }

  }

  async convertURLsToMediaArray(urls) {
    const mediaArray = [];

    for (const url of urls) {
      const _id = new ObjectId(); // Generate a new ObjectId
      const mediaItem = { _id, url };
      mediaArray.push(mediaItem);
    }

    return mediaArray;
  }

  async BannerValidation(input, loginResponse, check, eventCatgeoryCheck) {
    let match = {};
    let pipeline = [];
    /*Validate if isOrganizer is true and type is evnt_organizer or not.*/
    if (
      loginResponse.isOrganizer
        ? false
        : [ROLES.EVENT_ORGANIZER, ROLES.EVENT_VENDOR].includes(input.type)
    ) {
      this.errorService.error({ message: ERROR_MESSAGES.INVALID_TYPE }, 400);
    }
    /*if user is an advertiser then check the type is only advertiser.*/
    if (
      loginResponse?.isAdvertiser
        ? !(input.type === ROLES.EVENT_ADVERTISER)
        : false
    ) {
      this.errorService.error({ message: ERROR_MESSAGES.INVALID_TYPE }, 400);
    } else if (
      /*if user is an artist then check the type is only artist.*/
      loginResponse?.isArtist ? !(input.type === ROLES.EVENT_ARTIST) : false
    ) {
      this.errorService.error({ message: ERROR_MESSAGES.INVALID_TYPE }, 400);
    }
    /*check if event exists for artist/advertiser/organizer*/
    if (loginResponse?.isOrganizer) {
      match = {
        $match: {
          _id: new ObjectId(input.eventId),
          isDeleted: false,
          organizer: new ObjectId(loginResponse?.userId),
        },
      };

      if (input?.type) {
        const [isOwnerShipExists] = await this.ownershipModel.aggregate([
          {
            $match: {
              event: new ObjectId(input.eventId),
              type: input.type,
            },
          },
        ]);

        if (!isOwnerShipExists) {
          this.errorService.error(
            {
              message: `${input.type === ROLES.EVENT_ARTIST
                ? "Artist"
                : input.type === ROLES.EVENT_ADVERTISER
                  ? "Advertiser"
                  : "Vendor"
                } ${ERROR_MESSAGES.DOES_NOT_EXIST}`,
            },
            400
          );
        }
      }
    } else {
      /*if ownership is not exist in db then return error. */
      match = {
        $match: {
          _id: new ObjectId(input.eventId),
          isDeleted: false,
        },
      };
      const [isOwnerShipExist] = await this.ownershipModel.aggregate([
        {
          $match: {
            type: input?.type,
            event: new ObjectId(input?.eventId),
            isDeleted: false,
            ownerId: new ObjectId(
              loginResponse?.isArtist
                ? loginResponse.artistId
                : loginResponse.advertiserId
            ),
          },
        },
      ]);

      if (!isOwnerShipExist) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.INVALID_EVENT_ID,
          },
          400
        );
      }
    }
    pipeline.push(match);
    pipeline.push({
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
          _id: 1,
          eventStatus: 1,
          eventName: 1,
          venue: 1,
          status: 1,
          category: { $arrayElemAt: ["$eventCategory.eventCategory", 0] }
        },
      }
    )
    let [event] = await this.EventModel.aggregate(pipeline);
    /*if event*/
    if (!event) {
      this.errorService.error(
        {
          message: ERROR_MESSAGES.INVALID_EVENT_ID,
        },
        400
      );
    }
    else if ([Initialstatus.DRAFT, Initialstatus.NEW].includes(event.status)) {
      this.errorService.error(
        {
          message: `${ERROR_MESSAGES.CANNOT_GET_ADVERTISERS_BEFORE_PAYMENT}`,
        },
        409
      );
    } else if (eventCatgeoryCheck && event?.category === "Debate") {
      this.errorService.error(
        {
          message: ERROR_MESSAGES.INVALID_EVENT_ID,
        },
        400
      );
    }
    if (event.status === "PUBLISHED" && event.eventStatus && check) {
      this.errorService.error(
        {
          message:
            ERROR_MESSAGES.MEDIA_UPLOAD_IS_NOT_ALLOWED_ONCE_THE_EVENT_SALE_STARTS,
        },
        400
      );
    }
  }

  async uploadBanner(input: UploadBannerInput, loginResponse: any) {
    try {
      let pipeline = [];
      /*is event exist is artist/organizer all the validation would be here.*/
      await this.BannerValidation(input, loginResponse, true, true);
      await Promise.all(
        input.assets.map(async (asset, index) => {
          /*converting _id string to ObjectId*/
          asset._id = new ObjectId(asset._id);
          //----------check if the artist id matches in any of the docuemnt--------------
          if (asset.type === MEDIA_TYPE.IMAGE) {
            let thumbnail = await this.uploadCompressedFile(asset.link);
            asset["thumbnail"] = thumbnail;
          } else if (asset.type === MEDIA_TYPE.VIDEO) {
            let thumbnail = await this.generateThumbnail(asset.link);
            asset["thumbnail"] = thumbnail;
          }
        })
      );
      if (loginResponse?.isOrganizer) {
        pipeline.push(
          {
            type: input.type,
            event: new ObjectId(input?.eventId),
          },
          {
            $addToSet: {
              orgProgress: { $each: [ARTIST_PROGRESS.UPLOADBANNER] },
              assets: { $each: input?.assets },
            },
          }
        );
      } else {
        pipeline.push(
          {
            type: input.type,
            isDeleted: false,
            event: new ObjectId(input?.eventId),
            ownerId: new ObjectId(
              loginResponse?.isArtist
                ? loginResponse.artistId
                : loginResponse.advertiserId
            ),
          },
          {
            $addToSet: {
              progress: { $each: [ARTIST_PROGRESS.UPLOADBANNER] },
              ownerAssets: { $each: input?.assets },
            },
          }
        );
      }

      const response = await this.ownershipModel
        .updateMany(...pipeline, {
          new: true,
        })
        .then(() => this.ownershipModel.find(pipeline[0]));
      this.kafkaService.sendMessage(this.config.getKafkaTopic("FILE_BANNER"), {
        type: input.type,
        isOrganizer: loginResponse?.isOrganizer,
        event: input.eventId,
        data: loginResponse?.isOrganizer
          ? {
            assets: input.assets,
          }
          : {
            ownerAssets: input.assets,
            ownerId: loginResponse?.isArtist
              ? loginResponse.artistId
              : loginResponse.advertiserId,
            artistTracks: response[0]?.artistTrack,
          },
      });
      /*check if all the owners assets are uploaded.*/
      if (loginResponse?.isOrganizer) {
        if (input.type == ROLES.EVENT_VENDOR) {
          this.kafkaService.sendMessage(
            this.config.getKafkaTopic("VENDOR_ASSET"),
            {
              assets: response[0]?.assets,
              event: input.eventId,
            }
          );
        }
        await this.checkBannerProgress(input?.eventId);
      }
      if (response) {
        return {
          isOk: true,
          message: SUCCESS_MESSAGE.BANNERS_UPDATED_SUCCESSFULLY,
        };
      } else {
        return {
          isOk: false,
          message: SUCCESS_MESSAGE.BANNERS_ALREADY_UPDATED,
        };
      }
    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.ERROR_CREATING_BANNER, error);
      this.errorService.error({ message: error.message }, 400);
    }
  }

  async getBannerDetails(input: GetBannerInput, loginResponse) {
    try {
      /*is event exist is artist/organizer all the validation would be here.*/
      await this.BannerValidation(input, loginResponse, false, true);
      let pipeline = [];
      let isMeidaExists = false;
      if (loginResponse?.isOrganizer) {
        pipeline.push({
          /*if type then return type if not then return all types.*/
          $match: {
            type: input.type
              ? input.type
              : {
                $in: [
                  ROLES.EVENT_ORGANIZER,
                  ROLES.EVENT_ARTIST,
                  ROLES.EVENT_VENDOR,
                  ROLES.EVENT_ADVERTISER,
                ],
              },
            event: new ObjectId(input.eventId),
          },
        });
      } else {
        pipeline.push({
          $match: {
            type: input.type,
            ownerId: new ObjectId(
              loginResponse?.isArtist
                ? loginResponse.artistId
                : loginResponse.advertiserId
            ),
            event: new ObjectId(input.eventId),
            isDeleted: false,
          },
        });
      }
      const response = await this.ownershipModel.aggregate([...pipeline]);
      if (response.length) {
        const mediaType = loginResponse?.isOrganizer ? "assets" : "ownerAssets";
        response.forEach((item) => {
          if (!loginResponse?.isOrganizer) {
            item["assets"] = item["assets"].map((asset) => ({
              ...asset,
              link: this.generatePresignedUrl(asset.link),
            }));
          }
          if (item.assets.length > 0 && item.type != ROLES.EVENT_VENDOR) {
            isMeidaExists = true;
          }
          item["ownerAssets"] = item["ownerAssets"].map((asset) => ({
            ...asset,
            link: this.generatePresignedUrl(asset.link),
          }));
        });
      }
      return {
        getBanners: response,
        isMeidaExists,
      };
    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.BANNER_RETRIEVAL_ERROR, error);
      this.errorService.error({ message: error.message }, 400);
    }
  }

  async generatePresignedUrl(key: string) {
    let cachedUrl = await this.redisServer.getpreSignedURL(key);
    if (cachedUrl) {
      return cachedUrl;
    }
    const s3 = new AWS.S3({
      signatureVersion: "v4",
      accessKeyId: this.config.get("ACCESS_KEY"),
      secretAccessKey: this.config.get("SECRET_ACCESS_KEY"),
      region: this.config.get("REGION"),
    });
    let fileKey = key.split("/").pop();
    let image;
    try {
      image = await s3
        .getObject({
          Bucket: this.config.get("BUCKET_NAME"),
          Key: fileKey,
        })
        .promise();
    } catch (error) {
      if (error.code === "NoSuchKey") {
        throw this.errorService.error(
          { message: `${ERROR_MESSAGES.NO_VIDEO_FOUND_WITH_KEY} ${key}` },
          400
        );
      } else {
        throw this.errorService.error({ message: error }, 400); // Handle other errors accordingly
      }
    }
    const params = {
      Bucket: this.config.get("BUCKET_NAME"),
      Key: fileKey,
      Expires: parseInt(this.config.get("GENERATE_URL_EXPIRATION")), // 2 hrs
    };
    let data = s3.getSignedUrl("getObject", params);
    await this.redisServer.setPreSignedURL(key, data);
    return data;
  }

  async deleteBannerAssets(input, loginResponse) {
    try {
      await this.BannerValidation(input, loginResponse, true, true);
      let response;
      if (loginResponse?.isOrganizer) {
        response = await this.ownershipModel
          .updateMany(
            {
              "assets._id": new ObjectId(input.id),
              type: input.type,
              event: new ObjectId(input.eventId),
            },
            {
              $pull: {
                assets: { _id: new ObjectId(input.id) },
              },
            },
            {
              new: true,
            }
          )
          .then(() =>
            this.ownershipModel.findOne({
              type: input.type,
              event: new ObjectId(input.eventId),
            })
          );
        if (response.assets.length === 0) {
          await this.ownershipModel.updateMany(
            {
              type: input.type,
              event: new ObjectId(input.eventId),
            },
            { $pull: { orgProgress: { $in: [ARTIST_PROGRESS.UPLOADBANNER] } } }
          );
        }
      } else {
        let asset_exists = await this.ownershipModel.find({
          "ownerAssets._id": new ObjectId(input.id),
          type: input.type,
          ownerId: new ObjectId(
            loginResponse?.isArtist
              ? loginResponse.artistId
              : loginResponse.advertiserId
          ),
          event: new ObjectId(input.eventId),
          isDeleted: false,
        });
        if (asset_exists.length === 0) {
          return {
            isOk: false,
            message: ERROR_MESSAGES.ASSET_NOT_FOUND,
          };
        }
        response = await this.ownershipModel.findOneAndUpdate(
          {
            ownerId: new ObjectId(
              loginResponse?.isArtist
                ? loginResponse.artistId
                : loginResponse.advertiserId
            ),
            event: new ObjectId(input.eventId),
            isDeleted: false,
          },
          {
            $pull: { ownerAssets: { _id: new ObjectId(input.id) } },
          },
          { new: true }
        );
      }
      /*check if all the owners assets are uploaded.*/
      if (!loginResponse?.isOrganizer && response.ownerAssets.length === 0) {
        await this.ownershipModel.updateOne(
          { _id: response._id },
          { $pull: { progress: { $in: [ARTIST_PROGRESS.UPLOADBANNER] } } },
          { new: true }
        );
      } else if (input.type === ROLES.EVENT_VENDOR) {
        let vendor_assets = await this.ownershipModel.findOne({
          event: new ObjectId(input.eventId),
          type: ROLES.EVENT_VENDOR,
          isDeleted: false,
        });
        if (!!vendor_assets) {
          this.kafkaService.sendMessage(
            this.config.getKafkaTopic("VENDOR_ASSET"),
            {
              assets: vendor_assets?.assets ? vendor_assets?.assets : [],
              event: input.eventId,
            }
          );
        }
      } else if (input.type === ROLES.EVENT_ORGANIZER) {
        await this.checkBannerProgress(input.eventId);
      }

      if (response.modifiedCount != 0) {
        await this.kafkaService.sendMessage(
          this.config.getKafkaTopic("BANNER_DELETE"),
          {
            isOrganizer: loginResponse?.isOrganizer,
            type: input?.type,
            event: input.eventId,
            data: loginResponse?.isOrganizer
              ? {
                asset_Id: input.id,
              }
              : {
                asset_Id: input.id,
                ownerId: loginResponse?.isArtist
                  ? loginResponse.artistId
                  : loginResponse.advertiserId,
              },
          }
        );
        return {
          isOk: true,
          message: SUCCESS_MESSAGE.ASSET_DELETED_SUCCESSFULLY,
        };
      } else {
        return {
          isOk: false,
          message: ERROR_MESSAGES.ASSET_NOT_FOUND,
        };
      }
    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.ERROR_DELETING_BANNER, error);
      this.errorService.error({ message: error.message }, 400);
    }
  }
  async checkBannerProgress(eventId) {
    /*pipeline for check if current event have all the [ROLES.EVENT_ORGANIZER,ROLES.EVENT_ARTIST, ROLES.EVENT_VENDOR, "EVENT_ADVERSTISER"] uploaded assets or not. if assets then true else false.*/
    const pipeline = [
      {
        $match: {
          type: {
            $in: [ROLES.EVENT_ORGANIZER],
          },
          event: new ObjectId(eventId),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalAssets: { $sum: { $size: "$assets" } },
        },
      },
    ];
    const [response] = await this.ownershipModel.aggregate(pipeline);
    /*if response having result true (all [ROLES.EVENT_ORGANIZER,ROLES.EVENT_ARTIST, ROLES.EVENT_VENDOR, "EVENT_ADVERSTISER"] are uploaded there assets) then update event event progress.*/
    if (response?.totalAssets) {
      await this.EventModel.findByIdAndUpdate(
        new ObjectId(eventId),
        {
          $addToSet: {
            progress: { $each: [ARTIST_PROGRESS.UPLOADBANNER] },
          },
        },
        { new: true }
      );
    } else {
      /*If not then pull progress.*/
      await this.EventModel.findByIdAndUpdate(
        new ObjectId(eventId),

        { new: true }
      );
    }
  }

  async updateArtistAdvertiserProgress(input, loginResponse) {
    const { eventId } = input;
    const {
      isAdvertiser = false,
      isArtist = false,
      advertiserId = "",
      artistId = "",
    } = loginResponse;

    const matchQuery = {
      event: new ObjectId(eventId),
      ownerId: new ObjectId(isAdvertiser ? advertiserId : artistId),
      isDeleted: false,
    };

    const ownershipData = await this.ownershipModel.aggregate([
      { $match: matchQuery },
    ]);

    if (ownershipData.length) {
      const progressUpdate = [];

      if (isAdvertiser) {
        if (ownershipData[0]?.ownerAssets.length) {
          progressUpdate.push(ARTIST_PROGRESS.UPLOADBANNER);
        }
      } else if (isArtist) {
        const { ownerAssets, artistTrack, isMicEnabled, isMusicEnabled, isVideoEnabled, videoURL } =
          ownershipData[0];
        if (
          ownerAssets.length &&
          (isMusicEnabled && artistTrack.length > 0) || (isVideoEnabled && videoURL) ||
          (isMicEnabled && !isMusicEnabled && !isVideoEnabled) ||
          (isMicEnabled &&
            isMusicEnabled &&
            artistTrack.length > 0) || (isMicEnabled &&
              isVideoEnabled && videoURL)
        ) {
          progressUpdate.push(
            ARTIST_PROGRESS.UPLOADBANNER,
            ARTIST_PROGRESS.UPLOADMUSIC
          );
        } else if (ownerAssets.length) {
          progressUpdate.push(ARTIST_PROGRESS.UPLOADBANNER);
        } else if (
          (isMusicEnabled && artistTrack.length > 0) || (isVideoEnabled && videoURL) ||
          (isMicEnabled && !isMusicEnabled && !isVideoEnabled) ||
          (isMicEnabled &&
            isMusicEnabled &&
            artistTrack.length > 0) || (isMicEnabled &&
              isVideoEnabled && videoURL)
        ) {
          progressUpdate.push(ARTIST_PROGRESS.UPLOADMUSIC);
        }
      }
      if (progressUpdate.length) {
        await this.ownershipModel.updateOne(
          matchQuery,
          { $addToSet: { progress: { $each: progressUpdate } } },
          { new: true }
        );
      } else {
        await this.ownershipModel.updateOne(
          matchQuery,
          {
            $pull: {
              progress: {
                $in: [
                  ARTIST_PROGRESS.UPLOADBANNER,
                  ARTIST_PROGRESS.UPLOADMUSIC,
                ],
              },
            },
          },
          { new: true }
        );
      }
    }
  }
  async uploadCompressedFile(link) {
    try {
      if (!link) {
        return; // No link provided
      }
      const s3 = new AWS.S3({
        signatureVersion: "v4",
        accessKeyId: this.config.get("ACCESS_KEY"),
        secretAccessKey: this.config.get("SECRET_ACCESS_KEY"),
        region: this.config.get("REGION"),
      });
      const bucketName = this.config.get("BUCKET_NAME");
      const newarray = link.split("/");
      const lastWord = newarray[newarray.length - 1];
      // Check if the image exists in S3
      let image;
      try {
        image = await s3
          .getObject({ Bucket: bucketName, Key: lastWord })
          .promise();
      } catch (error) {
        if (error.code === "NoSuchKey") {
          throw this.errorService.error(
            { message: `${ERROR_MESSAGES.NO_IMAGE_FOUND_WITH_KEY} ${link}` },
            400
          );
          return; // The file does not exist
        } else {
          throw this.errorService.error({ message: error }, 400); // Handle other errors accordingly
        }
      }

      // Resize and compress the image
      const outputBuffer = await sharp(image.Body)
        .resize({
          width: 1000,
          height: 1000,
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();
      const params = {
        Bucket: bucketName,
        Key: `compressed-${lastWord}`,
        Body: outputBuffer,
        ACL: "public-read",
        ContentType: image.ContentType,
      };
      // Use util.promisify to convert the callback-style function to a promise
      const data = await s3.upload(params).promise();
      link = await this.generatePresignedUrl(data.Location);
      return data.Location;
    } catch (error) {
      throw error;
    }
  }
  async generateThumbnail(link) {
    try {
      const s3 = new AWS.S3({
        signatureVersion: "v4",
        accessKeyId: this.config.get("ACCESS_KEY"),
        secretAccessKey: this.config.get("SECRET_ACCESS_KEY"),
        region: this.config.get("REGION"),
      });
      const newarray = link.split("/");
      const lastWord = newarray[newarray.length - 1];
      const bucketName = this.config.get("BUCKET_NAME");
      // Check if the image exists in S3
      try {
        await s3.getObject({ Bucket: bucketName, Key: lastWord }).promise();
      } catch (error) {
        if (error.code === "NoSuchKey") {
          throw this.errorService.error(
            { message: `${ERROR_MESSAGES.NO_VIDEO_FOUND_WITH_KEY} ${link}` },
            400
          );
        } else {
          throw this.errorService.error({ message: error }, 400); // Handle other errors accordingly
        }
      }
      const thumbnailDirectory = "thumbnails";
      const fileName = `thumbnail-${new Date().getTime()}.jpg`;
      if (!fs.existsSync(thumbnailDirectory)) {
        fs.mkdirSync(thumbnailDirectory, { recursive: true });
      }
      const signedUrl = await this.generatePresignedUrl(link);
      const command = await ffmpeg(signedUrl);
      // Handle errors during thumbnail generation
      command.on("error", (err) => {
        this.errorService.error(
          { message: `${ERROR_MESSAGES.ERROR_GENERATING_THUMBNAIL} ${err}` },
          400
        );
      });

      const endPromise = new Promise<void>((resolve, reject) => {
        command.on("end", () => {
          resolve();
        });
      });

      command.screenshots({
        count: 1,
        folder: thumbnailDirectory,
        filename: fileName,
        size: COMPRESSED_SIZE.VIDEO_THUMBNAIL_SIZE,
        quality: 2,
      });
      await endPromise;
      // Upload the generated thumbnail to S3
      const thumbnailParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: fs.createReadStream(`${thumbnailDirectory}/${fileName}`),
      };
      const uploadData = await s3.upload(thumbnailParams).promise();
      await fs.promises.unlink(`${thumbnailDirectory}/${fileName}`);
      return uploadData.Location;
    } catch (error) {
      throw error;
    }
  }

  async venueExistance(dates, venueId) {
    try {
      const schedule = await checkSchedule(
        dates.startDate,
        dates.endDate,
        dates.duration,
        dates.startTime,
        dates.endTime
      );
      let pipeline = [];
      let match = {};
      let project = {};
      if (venueId) {
        match = {
          $match: {
            isDeleted: false,
            status: { $in: [Initialstatus.UNPUBLISHED, Initialstatus.PUBLISHED] },
            venue: { $in: (venueId) },
          },
        };
      }
      else {
        match = {
          $match: {
            isDeleted: false,
            status: { $in: [Initialstatus.UNPUBLISHED, Initialstatus.PUBLISHED] },
          },
        };
      }
      let isRangeMatch = {
        $match: {
          isInRange: true,
        },
      };
      project = {
        $project: {
          venue: 1,
        },
      };
      let group = {
        $group: {
          _id: null,
          venues: { $push: "$venue" },
        },
      };
      pipeline.push(match);
      pipeline.push(schedule[0]);
      pipeline.push(schedule[1]);
      pipeline.push(schedule[2]);
      pipeline.push(schedule[3]);
      pipeline.push(schedule[4]);
      pipeline.push(isRangeMatch);
      pipeline.push(project);
      pipeline.push(group);
      let existingVenues = await this.EventModel.aggregate(pipeline);
       return existingVenues;
    } catch (error) {
      return error
    }
  }
}
