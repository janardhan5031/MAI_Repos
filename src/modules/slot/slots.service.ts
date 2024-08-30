import { PaginationInput } from "src/common/shared/common.input_type";
import { HttpException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Artist } from "../../common/database/entities/artist.entity";
import { Slot } from "../../common/database/entities/slots.entity";
import { CreateSlotInput } from "./dto/slot.input_type";
import { LoggingService } from "src/common/logging/logging.service";
import { ErrorService } from "src/common/services/errorService";
import { differenceInCalendarDays } from "date-fns";
import { TimeConversionHelperService } from "src/common/helper/timezone";
import { Ownership } from "src/common/database/entities/meta/ownership.entity";
import { ConfigurationService } from "src/common/config/config.service";
import { OnwershipService } from "src/common/services/ownershipService";
import { KafkaService } from "src/common/kafka/kafka.service";
import {
  ERROR_MESSAGES,
  EVENT_STATUS,
  SUCCESS_MESSAGE,
} from "src/common/config/constants";
import { EventService } from "../event/events.service";
import { checkEventBeforeUpdatingDetails, checkEventStatusBeforeAddingDetails, generateSequence } from "src/common/helper/helper";
const { ObjectId } = require("mongodb");
const moment = require("moment");
require("moment-timezone");

@Injectable()
export class SlotService {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly timeConversionServer: TimeConversionHelperService,
    private readonly ownershipEngine: OnwershipService,
    private readonly eventService: EventService,
    private readonly errorService: ErrorService,
    @InjectModel(Artist.name)
    private readonly ArtistModel: Model<Artist>,
    @InjectModel(Event.name)
    private readonly EventModel: Model<Event>,
    @InjectModel(Slot.name)
    private readonly SlotModel: Model<Slot>,
    @InjectModel(Ownership.name)
    private readonly ownershipModel: Model<Ownership>,
    private readonly kafkaService: KafkaService,
    private readonly config: ConfigurationService
  ) { }
  async getEventDetails(eventId, artistId, loginResponse, checkEventCategory) {
    try {
      if (!loginResponse.isOrganizer) {
        this.errorService.error(
          { message: ERROR_MESSAGES.NOT_AN_ORGANIZER },
          400
        );
      }
      const [event] = await this.EventModel.aggregate([
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
            duration: 1,
            eventName: 1,
            eventStatus: 1,
            status: 1,
            category: { $arrayElemAt: ["$eventCategory.eventCategory", 0] }
          },
        },

      ]);
      //throw error if event category is Debate and trying to fetch / update the detials
      checkEventBeforeUpdatingDetails(event, checkEventCategory)
      let [artist] = await this.ArtistModel.aggregate([
        {
          $match: {
            _id: new ObjectId(artistId),
            isDeleted: false,
          },
        },
      ]);
      if (!artist) {
        this.errorService.error(
          { message: ERROR_MESSAGES.ARTIST_NOT_FOUND },
          400
        );
      }
      return { event, artist }
    } catch (error) {
      this.errorService.error({ message: error }, 400)
    }
  }
  async addSlotDebate(input, event, userTimeZone, preferredName) {
    try {
      input.eventId = new ObjectId(input.eventId);
      input.artistId = new ObjectId(input.artistId);
      let dbStartDate = new Date(event.startDate);
      let dbStartTime = event.startTime;
      let dbEndDate = new Date(event.endDate);
      let dbeventDuration = event.duration;
      let [hours, minutes] = dbStartTime.split(":").map(Number);
      dbStartDate.setUTCHours(hours, minutes, 0, 0);
      dbEndDate.setUTCHours(hours + dbeventDuration, minutes, 0, 0);
      let slotExists = await this.SlotModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $or: [
              { eventId: new ObjectId(input.eventId) },
              { artistId: new ObjectId(input.artistId) },
            ],
          },
        },
        {
          $match: {
            $or: [
              {
                $and: [
                  { startDate: { $lte: new Date(dbStartDate) } },
                  { endDate: { $gt: new Date(dbStartDate) } },
                ],
              },
              {
                $and: [
                  { startDate: { $lt: new Date(dbEndDate) } },
                  { endDate: { $gte: new Date(dbEndDate) } },
                ],
              },
              {
                $and: [
                  { startDate: { $lte: new Date(dbStartDate) } },
                  { endDate: { $gte: new Date(dbEndDate) } },
                ],
              },
              {
                $and: [
                  { startDate: { $gte: new Date(dbStartDate) } },
                  { endDate: { $lt: new Date(dbEndDate) } },
                ],
              },
            ],
          },
        },
      ]);
      if (slotExists.length) {
        throw new HttpException(
          { message: ERROR_MESSAGES.ARTIST_ALLOCATED },
          400
        );
      }
      // Example usage
      let data = (await generateSequence(`${event.startTime}-${event.endTime}`));
      let slot = await new this.SlotModel({
        startDate: dbStartDate,
        endDate: dbEndDate,
        timeArray: data,
        eventId: input.eventId,
        artistId: input.artistId,
        duration: event.duration * 60,
        slotTime: event.startTime,
        endTime: event.endTime,
      });

      slot.createdAt = new Date()
      await slot.save();
      await this.ownershipModel.findOne({
        event: new ObjectId(input.eventId),
        ownerId: new ObjectId(input.artistId),
        isDeleted: false,
      });
      let ownership_data = {
        ownerId: new ObjectId(input.artistId),
        event: new ObjectId(input.eventId),
        name: preferredName,
        type: "EVENT_ARTIST",
        eventName: event.eventName,
        assets: [],
        progress: ["UPLOADMUSIC"],
        isMicEnabled: true,
        ownerAssets: [],
        artistTrack: [],
        timeSlot: [{ startTime: slot.startDate, endTime: slot.endDate }],
        isDeleted: false,
        createdAt: new Date()
      };
      let owner = await new this.ownershipModel(ownership_data).save()
      await this.ownershipEngine.sendEmailToOwner(owner);
      this.kafkaService.sendMessage(
        this.config.getKafkaTopic("ADD_REMOVE_OWNERSHIP"),
        {
          isRemoved: false,
          result: owner,
        }
      );
      await this.EventModel.findByIdAndUpdate(
        input.eventId,
        {
          $addToSet: { progress: { $each: ["ARTIST"] } },
        },
        { new: true }
      );
      if (slot) {
        return {
          data: slot,
          isOk: true,
          message: SUCCESS_MESSAGE.SLOT_ADDED_SUCCESFULLY,
        };
      }
      throw new HttpException(
        { message: ERROR_MESSAGES.SOMETHING_WENT_WRONG },
        400
      );
    } catch (error) {
     return error 
    }
  }
  async addSlotNotDebate(input, event, userTimeZone, preferredName) {
    try {
      input["startTime"] = input.slotTime;
      input["endDate"] = input.startDate;
      let dbStartDate = new Date(event.startDate);
      let dbStartTime = event.startTime;
      let dbEndDate = new Date(event.endDate);
      let dbeventDuration = event.duration;
      let startDate: Date, endDate: Date;
      ({ startDate, endDate } =
        await this.timeConversionServer.timeConversation(input, userTimeZone));
      let startTime = moment.utc(startDate).clone().format("HH:mm");
      let endTime = moment.utc(endDate).clone().format("HH:mm");
      let [hours, minutes] = dbStartTime.split(":").map(Number);
      dbStartDate.setUTCHours(hours, minutes, 0, 0);
      let startTimeUTC = moment
        .utc(dbStartDate)
        .tz(userTimeZone)
        .format("HH:mm");
      dbEndDate.setUTCHours(hours + dbeventDuration, minutes, 0, 0);
      if (startDate > endDate) {
        throw new HttpException(
          {
            message: ERROR_MESSAGES.START_TIME_ERROR,
          },
          400
        );
      }
      dbStartDate.setUTCHours(0, 0, 0, 0);
      dbEndDate.setUTCHours(0, 0, 0, 0);
      let inputDate = new Date(startDate);
      inputDate.setUTCHours(0, 0, 0, 0);
      if (!(inputDate >= dbStartDate && inputDate <= dbEndDate)) {
        throw new HttpException(
          {
            message: ERROR_MESSAGES.START_DATE_ERROR,
          },
          400
        );
      }
      const startDateObject = moment(
        input.startDate,
        "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ"
      );
      const formattedStartDate = startDateObject.format("YYYY/MM/DD");

      const DateTimeString = `${formattedStartDate} ${startTimeUTC}`;
      const DateTime = moment.tz(
        DateTimeString,
        "YYYY/MM/DD HH:mm:ss",
        userTimeZone
      );
      inputDate = new Date(DateTime.utc().format());
      let eventTime = new Date(inputDate);
      eventTime.setUTCHours(
        inputDate.getUTCHours() + dbeventDuration,
        inputDate.getUTCMinutes(),
        0,
        0
      );
      if (!(startDate >= inputDate && endDate <= eventTime)) {
        throw new HttpException(
          {
            message: ERROR_MESSAGES.EVENT_TIME_ERROR,
          },
          400
        );
      }
      // Get duration in hours
      const differenceInMilliseconds = Math.abs(
        new Date(endDate).getTime() - new Date(startDate).getTime()
      );
      const duration = differenceInMilliseconds / (1000 * 60);
      if (duration != input.duration) {
        this.loggingService.log(`duration,${duration}, ${event.duration}}`);
        throw new HttpException(
          {
            message: ERROR_MESSAGES.DURATION_NOT_MATCHING,
          },
          400
        );
      }
      let slotExists = await this.SlotModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $or: [
              { eventId: new ObjectId(input.eventId) },
              { artistId: new ObjectId(input.artistId) },
            ],
          },
        },
        {
          $match: {
            $or: [
              {
                $and: [
                  { startDate: { $lte: new Date(startDate) } },
                  { endDate: { $gt: new Date(startDate) } },
                ],
              },
              {
                $and: [
                  { startDate: { $lt: new Date(endDate) } },
                  { endDate: { $gte: new Date(endDate) } },
                ],
              },
              {
                $and: [
                  { startDate: { $lte: new Date(startDate) } },
                  { endDate: { $gte: new Date(endDate) } },
                ],
              },
              {
                $and: [
                  { startDate: { $gte: new Date(startDate) } },
                  { endDate: { $lt: new Date(endDate) } },
                ],
              },
            ],
          },
        },
      ]);
      if (slotExists.length) {
        throw new HttpException(
          { message: ERROR_MESSAGES.ARTIST_ALLOCATED },
          400
        );
      }

      input.eventId = new ObjectId(input.eventId);
      input.artistId = new ObjectId(input.artistId);

      if (input?.slotId) {
        let slot = await this.SlotModel.findByIdAndUpdate(
          input.slotId,
          {
            startDate,
            endDate,
            duration: input.duration,
            slotTime: startTime,
            endTime: endTime,
          },
          {
            new: true,
          }
        );
        if (slot) {
          return {
            data: slot,
            isOk: true,
            message: SUCCESS_MESSAGE.SLOT_UPDATED_SUCCESSFULLY,
          };
        }
        throw new HttpException(
          { message: ERROR_MESSAGES.SLOT_ID_NOT_FOUND },
          400
        );
      }
      // Example usage
      let data = (await generateSequence(`${startTime}-${endTime}`));

      let slot = await new this.SlotModel({
        startDate,
        endDate,
        timeArray: data,
        eventId: input.eventId,
        artistId: input.artistId,
        duration: input.duration,
        slotTime: startTime,
        endTime: endTime,
      });

      slot.createdAt = await this.timeConversionServer.convertTZtoUTC(
        userTimeZone
      );
      await slot.save();
      let ownership = await this.ownershipModel.findOne({
        event: new ObjectId(input.eventId),
        ownerId: new ObjectId(input.artistId),
        isDeleted: false,
      });
      let ownership_data = {
        ownerId: new ObjectId(input.artistId),
        event: new ObjectId(input.eventId),
        name: preferredName,
        type: "EVENT_ARTIST",
        eventName: event.eventName,
        assets: [],
        ownerAssets: [],
        artistTrack: [],
        timeSlot: [{ startTime: slot.startDate, endTime: slot.endDate }],
        isDeleted: false,
      };
      let owner = await this.ownershipEngine.addOwnership(
        ownership_data,
        userTimeZone
      );
      if (event.status === "PUBLISHED" && event?.eventStatus === null) {
        let data = {
          ownershipId: new ObjectId(owner),
          event: new ObjectId(input.eventId),
          type: "EVENT_ARTIST",
        };
        const kafkaObj = {
          eventId: input.eventId,
          artistId: input.artistId,
          isRemoved: false,
        };
        this.kafkaService.sendMessage(
          this.config.getKafkaTopic("ADD_REMOVE_ARTIST"),
          kafkaObj
        );
      }
      let slots_done = await this.SlotModel.aggregate([
        { $match: { eventId: new ObjectId(input.eventId), isDeleted: false } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        {
          $unwind: "$event",
        },
        {
          $addFields: {
            dateRange: {
              $map: {
                input: {
                  $range: [
                    0,
                    {
                      $add: [
                        1,
                        {
                          $divide: [
                            {
                              $subtract: ["$event.endDate", "$event.startDate"],
                            },
                            86400000,
                          ],
                        },
                      ],
                    },
                    1,
                  ],
                },
                as: "day",
                in: {
                  $add: [
                    "$event.startDate",
                    { $multiply: ["$$day", 86400000] },
                  ],
                },
              },
            },
          },
        },
        {
          $group: {
            _id: "$eventId",
            slotDates: { $addToSet: "$startDate" },
            duration: { $sum: "$duration" },
            dateRange: { $first: "$dateRange" },
          },
        },
        {
          $addFields: {
            formattedDates: {
              $setUnion: [
                {
                  $map: {
                    input: "$slotDates",
                    as: "date",
                    in: {
                      $dateFromString: {
                        dateString: {
                          $concat: [
                            {
                              $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$$date",
                              },
                            },
                            "T00:00:00.000Z",
                          ],
                        },
                        format: "%Y-%m-%dT%H:%M:%S.%LZ",
                        timezone: "UTC",
                      },
                    },
                  },
                },
                [], // Empty array to handle cases where "slotDates" is empty
              ],
            },
          },
        },
        {
          $project: {
            _id: 0,
            eventId: "$_id",
            duration: 1,
            dateRange: 1,
            slotDates: 1,
            formattedDates: 1,
            valid: { $setIsSubset: ["$dateRange", "$formattedDates"] },
          },
        },
      ]);
      if (
        slots_done.length &&
        slots_done[0]?.valid &&
        slots_done[0].duration ===
        (event.duration *
          (Math.abs(
            differenceInCalendarDays(event.startDate, event.endDate)
          ) +
            1) * 60)
      ) {
        event = await this.EventModel.findByIdAndUpdate(
          input.eventId,
          {
            $addToSet: { progress: { $each: ["ARTIST"] } },
          },
          { new: true }
        );
      }

      if (slot) {
        event = await this.EventModel.findByIdAndUpdate(
          input.eventId,
          {
            $pull: { progress: "ASSIGNBANNER" },
          },
          { new: true }
        );
        return {
          data: slot,
          isOk: true,
          message: SUCCESS_MESSAGE.SLOT_ADDED_SUCCESFULLY,
        };
      }
      throw new HttpException(
        { message: ERROR_MESSAGES.SOMETHING_WENT_WRONG },
        400
      );
    } catch (error) {
      return error
    }
  }
  async addSlot(
    input: CreateSlotInput,
    loginResponse: any,
    userTimeZone: string
  ) {
    try {
      let { event, artist } = await this.getEventDetails(input.eventId, input.artistId, loginResponse, false)
      if (event.category === "Debate") {
        let artistSlotExists = await this.SlotModel.findOne({ eventId: new ObjectId(input.eventId), isDeleted: false, artistId: new ObjectId(input.artistId) })
        if (artistSlotExists) {
          this.errorService.error({ message: "Artsist already exists for this event" }, 400)
        }
        return await this.addSlotDebate(input, event, userTimeZone, artist.preferredName)
      }
      else {
        if (!input.slotTime) {
          this.errorService.error({ message: ERROR_MESSAGES.EMPTY_SLOT_TIME }, 400);
        }
        if (!input.endTime) {
          this.errorService.error({ message: ERROR_MESSAGES.EMPTY_END_TIME }, 400);
        }
        if (!input.startDate) {
          this.errorService.error({ message: ERROR_MESSAGES.EMPTY_START_DATE }, 400);
        }
        if (!input.duration || (input.duration < 1 || input.duration % 15 != 0)) {
          this.errorService.error({ message: ERROR_MESSAGES.EMPTY_DURATION }, 400);
        }
        return await this.addSlotNotDebate(input, event, userTimeZone, artist.preferredName)
      }

    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.ADDING_SLOTS, error);
      this.errorService.error({ message: error.message }, 400);
    }
  }

  async getallslotsbyEventId(
    eventId: string,
    pagination: PaginationInput,
    loginResponse: any,
    userTimeZone: string
  ) {
    try {
      let slots;
      if (!loginResponse.isOrganizer) {
        this.errorService.error(
          { message: ERROR_MESSAGES.USER_NOT_ORGANISER },
          400
        );
      }
      const [isEventExist] = await this.EventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            organizer: new ObjectId(loginResponse?.userId),
            isDeleted: false,
          },
        },
      ]);
      if (!isEventExist) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.INVALID_EVENT_ID,
          },
          400
        );
      } else if (["DRAFT", "NEW"].includes(isEventExist.status)) {
        return this.errorService.error(
          {
            message: ERROR_MESSAGES.ARTIST_PAYMENT_INCOMPLETE,
          },
          409
        );
      }
      pagination.skip = pagination.skip >= 0 ? pagination.skip : 0;
      pagination.limit = pagination.limit > 0 ? pagination.limit : 3;
      slots = await this.SlotModel.aggregate([
        {
          $match: { eventId: new ObjectId(eventId), isDeleted: false },
        },
        {
          $lookup: {
            from: "artists",
            localField: "artistId",
            foreignField: "_id",
            pipeline: [{ $project: { name: 1, _id: 0 } }],
            as: "artistId",
          },
        },
        {
          $unwind: {
            path: "$artistId",
            preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
          },
        },
        {
          $addFields: {
            artist: "$artistId.name",
          },
        },
        {
          $project: {
            artist: 1,
            slotTime: 1,
            startDate: 1,
            duration: 1,
            eventId: 1,
            _id: 1,
          },
        },
        {
          $facet: {
            result: [
              { $skip: pagination.skip * pagination.limit },
              { $limit: pagination.limit },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
      ]);
      return {
        data: slots[0]?.result ? slots[0]?.result : [],
        total: slots[0]?.totalCount[0]?.count
          ? slots[0]?.totalCount[0]?.count
          : 0,
        filtered: slots[0]?.result.length ? slots[0]?.result.length : 0,
      };
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.UNABLE_ADD_SLOT_ERROR, error);
      return error;
    }
  }
  async getallslotbyId(
    slotId: string,
    loginResponse: any,
    userTimeZone: string
  ) {
    try {
      let slots;
      if (!loginResponse.isOrganizer) {
        this.errorService.error(
          { message: ERROR_MESSAGES.USER_NOT_ORGANISER },
          400
        );
      }
      [slots] = await this.SlotModel.aggregate([
        {
          $match: { _id: new ObjectId(slotId), isDeleted: false },
        },
        {
          $lookup: {
            from: "artists",
            localField: "artistId",
            foreignField: "_id",
            pipeline: [{ $project: { name: 1, _id: 1 } }],
            as: "artistId",
          },
        },
        {
          $unwind: {
            path: "$artistId",
            preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
          },
        },
        {
          $project: {
            artistId: 1,
            SlotTime: 1,
            endDate: 1,
            startDate: 1,
            duration: 1,
            eventId: 1,
          },
        },
      ]);
      slots.slotTime = moment
        .utc(slots.startDate)
        .tz(userTimeZone)
        .format("HH:mm");
      slots.endTime = moment
        .utc(slots.endDate)
        .tz(userTimeZone)
        .format("HH:mm");
      (slots.startDate = new Date(
        moment.utc(slots.startDate).tz(userTimeZone).format("YYYY-MM-DD")
      )),
        (slots.endDate = new Date(
          moment.utc(slots.endDate).tz(userTimeZone).format("YYYY-MM-DD")
        ));
      return slots;
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.UNBALE_TO_GET_SLOT, error);
      return error;
    }
  }
  //for delete slot
  async deleteSlots(slotId: String, loginResponse: any, userTimeZone: string) {
    try {
      if (!loginResponse.isOrganizer) {
        this.errorService.error(
          { message: ERROR_MESSAGES.USER_NOT_ORGANISER },
          400
        );
      }
      const slot = await this.SlotModel.aggregate([
        { $match: { _id: new ObjectId(slotId) } },
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "eventId",
          },
        },
        {
          $unwind: {
            path: "$eventId",
            preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
          },
        },
      ]);
      if (!slot?.length) return new Error(ERROR_MESSAGES.SLOT_ID_NOT_FOUND);
      else if (slot?.length && slot[0].isDeleted)
        return new Error(ERROR_MESSAGES.SLOT_ALREADY_DELETED);
      if (
        slot[0].eventId.status === "PUBLISHED" &&
        slot[0].eventId.eventStatus
      ) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.ADDING_DETAILS_AFTER_SALE_START,
          },
          400
        );
      }
      let result: any = await this.SlotModel.findOneAndDelete({
        _id: new ObjectId(slotId),
      });
      if (result) {
        await this.EventModel.findByIdAndUpdate(
          result.eventId._id,
          {
            $pull: { progress: "ARTIST" },
          },
          { new: true }
        );
      }

      let ownership = {
        event: new ObjectId(slot[0].eventId._id),
        ownerId: new ObjectId(slot[0].artistId),
        timeSlot: [
          {
            startTime: result.startDate,
            endTime: result.endDate,
          },
        ],
      };
      await this.ownershipEngine.deleteOwnership(ownership, userTimeZone);
      await this.eventService.updateProgress(slot[0].eventId._id);
      if (slot[0].eventId["status"] === EVENT_STATUS.PUBLISHED && slot[0].eventId["eventStatus"] === null) {
        const kafkaObj = {
          eventId: slot[0].eventId._id,
          artistId: slot[0].artistId,
          isRemoved: true,
        };
        this.kafkaService.sendMessage(
          this.config.getKafkaTopic("ADD_REMOVE_ARTIST"),
          kafkaObj
        );
      }
      result.isOk = true;
      result.message = SUCCESS_MESSAGE.SLOT_DELETED_SUCCESFULLY;
      return result;
    } catch (error) {
      LoggingService.error(ERROR_MESSAGES.FETCH_USER_ERROR, error);
      return error;
    }
  }

  async getSlotDate(
    eventId: string,
    artistId: string,
    loginResponse: any,
    userTimeZone: string
  ) {
    try {
      let { event } = await this.getEventDetails(eventId, artistId, loginResponse, true)
      let startDate = event.startDate;
      let endDate = event.endDate;
      let [hours, minutes] = event.startTime.split(":").map(Number);
      startDate.setUTCHours(hours, minutes);
      endDate.setUTCHours(hours, minutes);
      const dateRange = getDatesBetween(startDate, endDate);
      let dates = await Promise.all(
        dateRange.map(async (date, index) => {
          let endDate = new Date(date);
          endDate.setUTCHours(
            date.getUTCHours() + event.duration,
            date.getUTCMinutes(),
            0,
            0
          );
          let slot = await this.SlotModel.aggregate([
            {
              $match: {
                $or: [
                  {
                    eventId: new ObjectId(eventId),
                  },
                  {
                    artistId: new ObjectId(artistId),
                  },
                ],
                startDate: { $gte: date },
                endDate: { $lte: endDate },
                isDeleted: false,
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$duration" },
              },
            },
          ]);
          if (
            !(slot[0]?.totalAmount && slot[0]?.totalAmount === (event.duration * 60))
          ) {
            return dateRange[index];
          } else {
            return null;
          }
        })
      );
      dates = dates.filter((date) => date !== null);
      const convertedDates: Date[] = await Promise.all(
        dates.map(async (utcDate) => {
          return this.timeConversionServer.convertUTCtoTZDate(
            utcDate,
            userTimeZone
          );
        })
      );
      return { dates: convertedDates };
    } catch (error) {
      this.loggingService.error(
        ERROR_MESSAGES.FETCH_EVENT_RECOMMENDATION,
        error
      );
      return error;
    }
  }

  async getSlotTime(
    eventId: string,
    artistId: string,
    date: Date,
    loginResponse: any,
    userTimeZone: string
  ) {
    try {
      let { event } = await this.getEventDetails(eventId, artistId, loginResponse, true)
      let input = {
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
      };
      const startDateObject = moment(
        input.startDate,
        "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ"
      );
      const formattedStartDate = startDateObject.format("YYYY/MM/DD");
      const combinedStartDateTimeString = `${formattedStartDate} ${input.startTime}`;
      let UTCmoment = moment.utc(

        combinedStartDateTimeString,
        "YYYYMMDD HH:mm:ss"
      );
      let startDateEvent = new Date(UTCmoment);
      let startDate = UTCmoment.clone()
        .tz(userTimeZone)
        .format("YYYY-MM-DD HH:mm:ss");
      const endDateObject = moment(
        input.endDate,
        "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ"
      );
      const inputdate = moment(date, "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
      const formattedendDate = endDateObject.format("YYYY/MM/DD");
      const combinedendDateTimeString = `${formattedendDate} ${input.startTime}`;
      UTCmoment = moment.utc(combinedendDateTimeString, "YYYYMMDD HH:mm:ss");
      let endDateEvent = new Date(UTCmoment);
      let endDate = UTCmoment.clone()
        .tz(userTimeZone)
        .format("YYYY-MM-DD HH:mm:ss");
      const endDateDate = moment(endDate).format("YYYY/MM/DD");
      const combinedenTimeString = `${endDateDate} ${input.endTime}`;
      UTCmoment = moment.utc(combinedenTimeString, "YYYYMMDD HH:mm:ss");
      let eventEndTime = UTCmoment.clone()
        .tz(userTimeZone)
        .format("YYYY-MM-DD HH:mm:ss");
      let startTime = moment.utc(startDate).clone().format("HH:mm");
      let endTime = moment.utc(eventEndTime).clone().format("HH:mm");
      const inputDate = inputdate.format("YYYY/MM/DD");
      const inputDateconverted = `${inputDate} ${startTime}`;
      const locastartDateTime = moment.tz(

        inputDateconverted,
        "YYYY/MM/DD HH:mm:ss",
        userTimeZone
      );
      let inputstartDate = new Date(locastartDateTime.utc().format());
      const inputendDateconverted = `${inputDate} ${endTime}`;
      const localendDateTime = moment.tz(
        inputendDateconverted,
        "YYYY/MM/DD HH:mm:ss",
        userTimeZone
      );
      let inputendDate = new Date(localendDateTime.utc().format());
      if (
        !(inputstartDate >= startDateEvent && inputstartDate <= endDateEvent)
      ) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.DATE_ERROR },
          400
        );
      }
      let timeIntervals = splitTimeRange(inputstartDate, inputendDate);
      const slots = await this.SlotModel.aggregate([
        {
          $match: {
            $or: [
              { eventId: new ObjectId(eventId) },
              { artistId: new ObjectId(artistId) },
            ],
            startDate: { $lte: new Date(inputendDate) },
            endDate: { $gte: new Date(inputstartDate) },
            isDeleted: false,
          },
        },
      ]);
      // Create a set of time ranges that are occupied
      const occupiedTimeRanges = new Set();
      slots.forEach(slot => {
        const start = new Date(slot.startDate).getTime();
        const end = new Date(slot.endDate).getTime();
        for (let time = start; time < end; time += 15 * 60 * 1000) {
          occupiedTimeRanges.add(time);
        }
      });

      // Determine available time intervals
      const availableTimeIntervals = timeIntervals
        .map(time => {
          const timeMs = new Date(time).getTime();
          if (!occupiedTimeRanges.has(timeMs)) {
            return moment.utc(time).clone().tz(userTimeZone).format("HH:mm");
          }
          return null;
        })
        .filter(interval => interval !== null);

      return { time: availableTimeIntervals }

    } catch (error) {
      this.loggingService.error(
        ERROR_MESSAGES.FETCH_EVENT_RECOMMENDATION,
        error
      );
      return error;
    }
  }
  async getSlotDurtaion(
    eventId: string,
    artistId: string,
    date: Date,
    slotTime: string,
    loginResponse: any,
    userTimeZone: string
  ) {
    try {
      let { event } = await this.getEventDetails(eventId, artistId, loginResponse, true)

      const duration = event.duration;
      //changed string to date format using moment js
      const formattedStartDate = moment(date).format("YYYY/MM/DD");
      //combined date and time strings 
      const combinedStartDateTimeString = `${formattedStartDate} ${slotTime}`;
      const localStartDateTime = moment.tz(combinedStartDateTimeString, "YYYY/MM/DD HH:mm:ss", userTimeZone);
      ///converting to user timezone date to UTC
      let startDate = new Date(localStartDateTime.utc().format());
      //getting hours and minutes from event startTime
      let [hours, minutes] = event.startTime.split(":").map(Number);
      //getting event startDate
      let eventStartDate = new Date(event.startDate);
      // //setting event startDate and startTime
      eventStartDate.setUTCHours(hours, minutes, 0, 0);
      //setting event end Date
      let eventEndDate = new Date(event.endDate);
      eventEndDate.setUTCHours(hours + duration, minutes, 0, 0);
      let inputDate = new Date(startDate);
      let startTime = moment
        .utc(eventStartDate)
        .tz(userTimeZone)
        .format("HH:mm");
      inputDate.setUTCHours(0, 0, 0, 0);
      //getting only dates without time
      eventStartDate.setUTCHours(0, 0, 0, 0);
      eventEndDate.setUTCHours(0, 0, 0, 0);
      //error if date is not within event dates
      if (!(inputDate >= eventStartDate && inputDate <= eventEndDate)) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.DATE_ERROR },
          400
        );
      }
      const DateTimeString = `${formattedStartDate} ${startTime}`;
      const DateTime = moment.tz(
        DateTimeString,
        "YYYY/MM/DD HH:mm:ss",
        userTimeZone
      );
      let inputDatewitheventStartTime = new Date(DateTime.utc().format());
      let endDate = new Date(inputDatewitheventStartTime);
      endDate.setUTCHours(inputDatewitheventStartTime.getUTCHours() + duration);
      if (!(startDate >= inputDatewitheventStartTime && startDate <= endDate)) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.TIME_ERROR },
          400
        );
      }
      eventEndDate.setUTCHours(hours + duration, minutes, 0, 0);
      let slot_durtaion = await this.SlotModel.aggregate([
        {
          $match: {
            $or: [
              {
                eventId: new ObjectId(eventId),
              },
              {
                artistId: new ObjectId(artistId),
              },
            ],
            startDate: { $gte: inputDatewitheventStartTime },
            endDate: { $lte: endDate },
            isDeleted: false,
          },
        },
        {
          $addFields: {
            exists: {
              $cond: {
                if: {
                  $and: [
                    { $lte: ["$startDate", startDate] },
                    { $gt: ["$endDate", startDate] },
                  ],
                },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $addFields: {
            timeDifference: {
              $subtract: ["$startDate", new Date(startDate)],
            },
          },
        },
        {
          $facet: {
            dataTrue: [
              {
                $match: {
                  exists: true,
                },
              },
              // Add other stages for the "exists: true" case if needed
            ],
            dataFalse: [
              {
                $match: {
                  exists: false,
                  timeDifference: { $gt: 0 },
                },
              },
              {
                $sort: {
                  timeDifference: 1,
                },
              },
              {
                $limit: 1,
              },
            ],
          },
        },
      ]);
      if (slot_durtaion && slot_durtaion[0]?.dataTrue?.length) {
        return { duration: [] };
      }
      slotTime = moment.utc(startDate).tz(userTimeZone).format("HH:mm");
      let slots_slotTime = moment
        .utc(slot_durtaion[0]?.dataFalse[0]?.startDate)
        .tz(userTimeZone)
        .format("HH:mm");
      let endTime = moment.utc(eventEndDate).tz(userTimeZone).format("HH:mm");
      let event_duration;
      if (!slot_durtaion[0]?.dataFalse?.length) {
        event_duration = await calculateTimeDuration(slotTime, endTime);
      } else {
        event_duration = await calculateTimeDuration(slotTime, slots_slotTime);
        if (event_duration < 0) {
          event_duration = await calculateTimeDuration(slotTime, endTime);
        }
      }// example event duration in hours
      let durationRange = Array.from(
        { length: event_duration / 15 },
        (_, i) => (i + 1) * 15
      );

      return { duration: durationRange };
    } catch (error) {
      this.loggingService.error(
        ERROR_MESSAGES.FETCH_EVENT_RECOMMENDATION,
        error
      );
      return error;
    }

  }
}
function getDatesBetween(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // currentDate.setUTCHours(0, 0, 0, 0); // Set time to 12:00 AM
    dates.push(new Date(currentDate)); // Push a new Date object
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

function splitTimeRange(startDate, endDate) {
  const intervals = [];
  let start = new Date(startDate);
  let end = new Date(endDate);
  let startTime = moment.utc(startDate).clone().format("HH:mm");
  let endTime = moment.utc(endDate).clone().format("HH:mm");
  const startParts = startTime.split(":");
  const endParts = endTime.split(":");
  start.setUTCHours(Number(startParts[0]));
  start.setUTCMinutes(Number(startParts[1]));
  end.setUTCHours(Number(endParts[0]));
  end.setUTCMinutes(Number(endParts[1]));
  // Change the interval increment to 1 hour (60 minutes)
  while (start < end) {
    intervals.push(start.toISOString());
    start.setUTCMinutes(start.getUTCMinutes() + 15); // Change the increment to 60 minutes
  }
  return intervals;
}

function calculateTimeDuration(startTime, endTime) {
  const startParts = startTime.split(":");
  const endParts = endTime.split(":");

  const startHour = parseInt(startParts[0], 10);
  const startMinute = parseInt(startParts[1], 10);
  const endHour = parseInt(endParts[0], 10);
  const endMinute = parseInt(endParts[1], 10);

  const start = (startHour * 60 + startMinute); // Convert start time to hours
  const end = (endHour * 60 + endMinute); // Convert end time to hours
  const duration = end - start; // Calculate duration in hours
  return duration;
}
