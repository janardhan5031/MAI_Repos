import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { LoggingService } from "src/common/logging/logging.service";
import { AddTicket } from "./dto/ticket.input_types";
import { Event } from "../../common/database/entities/events.entity";
import { ErrorService } from "src/common/services/errorService";
import { KafkaService } from "src/common/kafka/kafka.service";
import { ConfigurationService } from "src/common/config/config.service";
import { NotificationEngine } from "src/common/services/notification_engine";
import {
  ERROR_MESSAGES,
  EVENT_STATUS,
  FORMAT_DATE,
  PROGRESS_ORGANIZER,
} from "src/common/config/constants";
const moment = require("moment");
const { ObjectId } = require("mongodb");

@Injectable()
export class TicketService {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly errorService: ErrorService,
    private readonly kafkaService: KafkaService,
    private readonly config: ConfigurationService,
    private readonly notificationEngine: NotificationEngine,
    @InjectModel(Event.name)
    private readonly eventModel: Model<Event>
  ) { }

  async addTicket(eventId: String, addTicket: AddTicket, loginResponse: any) {
    try {
      if (!loginResponse?.isOrganizer) {
        return new Error(ERROR_MESSAGES.NOT_AN_ORGANIZER);
      }
      
      const isEventExist = await this.eventModel.findOne({
        _id: new ObjectId(eventId),
        organizer: new ObjectId(loginResponse?.userId),
        isDeleted: false,
      });
      if (!isEventExist) {
        return this.errorService.error(
          {
            message: ERROR_MESSAGES.INVALID_EVENT_ID,
          },
          404
        );
      } else if (
        [EVENT_STATUS.NEW, EVENT_STATUS.DRAFT].includes(isEventExist.status)
      ) {
        return this.errorService.error(
          {
            message: ERROR_MESSAGES.CANNOT_ADD_TICKET_BEFORE_PAYMENT,
          },
          409
        );
      } else if (
        isEventExist.status === EVENT_STATUS.PUBLISHED &&
        isEventExist.eventStatus
      ) {
        return this.errorService.error(
          {
            message: ERROR_MESSAGES.ADDING_DETAILS_AFTER_SALE_START,
          },
          400
        );
      }
      const [eventDetails] = await this.eventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "venues",
            localField: "venue",
            foreignField: "_id",
            pipeline: [
              {
                $addFields: {
                  seats: "$userCount.max",
                },
              },
              { $project: { seats: 1, userCount: 1 } },
            ],
            as: "venue",
          },
        },
        {
          $addFields: {
            venue: {
              $cond: {
                if: { $eq: [{ $size: "$venue" }, 0] },
                then: [{ seats: null }],
                else: "$venue",
              },
            },
          },
        },
        {
          $unwind: "$venue",
        },
      ]);
      if (eventDetails?.venue?.seats < addTicket.ticketCount) {
        return this.errorService.error(
          {
            message: ERROR_MESSAGES.TICKET_CREATION_EXCEEDS_CAPACITY,
          },
          400
        );
      }
      let updatedAt = new Date();
      let event = await this.eventModel.findByIdAndUpdate(
        eventId,
        {
          ticketPrice: addTicket.ticketPrice,
          ticketCount: addTicket.ticketCount,
          ticketLeft: addTicket.ticketCount,
          isFreeEntry: addTicket.isFreeEntry,
          updatedAt,
          $addToSet: { progress: { $each: [PROGRESS_ORGANIZER.TICKETS] } },
        },
        { new: true }
      );

      let data: any = {
        organizerName: loginResponse.first_name +
          " " +
          loginResponse.last_name
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .trim(),
        ticketCount: event.ticketCount,
        eventName: event.eventName,
        eventDate: moment.utc(event.startDate).format(FORMAT_DATE.DATE_FORMAT),
        startTime: event.startTime,
        endTime: event.endTime
      }

      let organizer = {
        userId: loginResponse._id,
        email: this.config.get("MAI_HELP_EMAIL")
      };

      if (event.ticketCount > Number(this.config.get("EVENT_TICKET_REQUEST_COUNT"))) {
        this.notificationEngine.ticketCountRequest(organizer, data);
      }

      if (event.status === EVENT_STATUS.PUBLISHED) {
        this.kafkaService.sendMessage(
          this.config.getKafkaTopic("UPDATE_EVENTS_TOPIC"),
          {
            ticketCount: addTicket.ticketCount,
            ticketPrice: addTicket.ticketPrice,
            isFreeEntry: addTicket.isFreeEntry,
            _id: eventId,
            status: event.status,
          }
        );
      }
      return {
        eventId: event._id,
        ticketPrice: event.ticketPrice,
        ticketCount: event.ticketCount,
        seats: eventDetails.venue.seats,
        isFreeEntry: event.isFreeEntry,
      };
    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.ERROR_CREATING_TICKETS, error);
      this.errorService.error({ message: error.message }, 400);
    }
  }

  async ticket(eventId, loginResponse) {
    try {
      if (!loginResponse?.isOrganizer) {
        throw new Error(ERROR_MESSAGES.NOT_AN_ORGANIZER);
      }

      const isEventExist = await this.eventModel.findOne({
        _id: new ObjectId(eventId),
        organizer: new ObjectId(loginResponse?.userId),
        isDeleted: false,
      });

      if (!isEventExist) {
        throw this.errorService.error(
          {
            message: ERROR_MESSAGES.INVALID_EVENT_ID,
          },
          404
        );
      }
      const event = await this.eventModel.aggregate([
        { $match: { _id: new ObjectId(eventId), isDeleted: false } },
        {
          $lookup: {
            from: "venues",
            localField: "venue",
            foreignField: "_id",
            pipeline: [
              { $addFields: { seats: "$userCount.max" } },
              { $project: { seats: 1, userCount: 1, _id: 0 } },
            ],
            as: "venue",
          },
        },
        {
          $addFields: {
            venue: {
              $cond: {
                if: { $eq: [{ $size: "$venue" }, 0] },
                then: [{ seats: null }],
                else: "$venue",
              },
            },
          },
        },
        { $unwind: "$venue" },
        {
          $project: {
            ticketCount: 1,
            ticketsLeft: 1,
            ticketPrice: 1,
            csvLink : "$csv.csvLink",
            csvName: "$csv.csvFileName",
            status: 1,
            venue: 1,
          },
        },
      ]);
      return {
        ticketCount: event[0]?.ticketCount || 0,
        ticketPrice: event[0]?.ticketPrice || 0,
        ticketsLeft: event[0]?.ticketsLeft || 0,
        csvLink : event[0]?.csvLink,
        csvName : event[0]?.csvName,
        isFreeEntry:
          event[0]?.isFreeEntry || event[0]?.ticketPrice > 0 ? false : true,
        seats: event[0]?.venue.seats || 0,
        eventId: eventId,
      };
    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.ERROR_GETTING_TICKETS, error);
      throw this.errorService.error({ message: error.message }, 400);
    }
  }
}
