import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConfigurationService } from "../../common/config/config.service";
import { LoggingService } from "../../common/logging/logging.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Model } from "mongoose";
import { Event } from "../../common/database/entities/events.entity";
import { NotificationEngine } from "../services/notification_engine";
import { Ownership } from "../database/entities/meta/ownership.entity";
import { KafkaService } from "../kafka/kafka.service";
import {
  EVENT_STATUS,
  FORMAT_DATE,
  LOG_MESSAGES,
  ROLES,
} from "../config/constants";
import axios from "axios";
import { Analytics } from "../database/entities/analytics.entity";
import { RedisHelperService } from "../redis-helpers/redis-helper.service";
import { EventService } from "src/modules/event/events.service";
import { Languages } from "../database/entities/languages";
import { EventCategory } from "../database/entities/eventCategories";
const moment = require("moment");
require("moment-timezone");
const cron = require("node-cron");
const { ObjectId } = require("mongodb");

@Injectable()
export class CronService {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly eventService: EventService,
    private readonly kafkaService: KafkaService,
    private readonly config: ConfigurationService,
    private readonly notificationEngine: NotificationEngine,
    private readonly redisHelperService: RedisHelperService,
    @InjectModel(Event.name)
    private readonly EventModel: Model<Event>,
    @InjectModel(Analytics.name)
    private readonly analyticsModel: Model<Analytics>,
    @InjectModel(Ownership.name)
    private readonly ownershipModel: Model<Ownership>,
  ) { }
  @Cron("*/1 * * * *")
  async eventSaleStart() {
    const key = new Date(new Date().setUTCSeconds(0, 0));
    const lockAcquired = await this.redisHelperService.acquireLock(key);
    if (!lockAcquired) {
      this.loggingService.log(`Resource is locked- ${new Date()}`);
      return
    }
    try {
      const currentDate = new Date();
      currentDate.setUTCHours(
        currentDate.getUTCHours(),
        currentDate.getUTCMinutes(),
        0,
        0
      );
      const eventsToUpdate = await this.EventModel.find({
        saleStartDate: currentDate,
        $or: [{ eventStatus: EVENT_STATUS.SALESCHEDULED }, { eventStatus: null }],
        isDeleted: false,
      }).populate("organizer");
      //  Update the status of the found events
      if (eventsToUpdate.length > 0) {
        await this.EventModel.updateMany(
          { _id: { $in: eventsToUpdate.map((event) => event._id) } },
          { $set: { eventStatus: EVENT_STATUS.SALESTARTED } },
          { new: true }
        );
        this.kafkaService.sendMessage(
          this.config.getKafkaTopic("START_END_SALE"),
          {
            isSaleStarted: true,
            eventDetails: eventsToUpdate.map((event) => ({
              _id: event._id,
              saleStartDate: event.saleStartDate,
              saleEndDate: event.saleEndDate,
            })),
          }
        );
        await Promise.all(
          eventsToUpdate.map(async (event: any, index) => {
            let res = await this.analyticsModel.findOne({
              eventId: new ObjectId(event._id),
              isDeleted: false,
            });
            if (!res) {
              await this.analyticsModel.create({
                eventId: new ObjectId(event._id),
                eventName: event.eventName,
                isDeleted: false,
                createdAt: new Date()
              });
            }
            let organizer = {
              userId: event?.organizer?.userId,
              email: event?.organizer?.email,
            };
            let name = event?.organizer?.name
            let [first_name, last_name] = name.split(" ");
            let organizerData = {
              _id: event?.organizer?.userId,
              first_name,
              last_name,
            };
            let data = {
              organizerName: event.organizer?.name,
              eventName: event?.eventName,
              startDate: moment
                .utc(event.startDate)
                .format(FORMAT_DATE.DATE_FORMAT),
              startTime: event.startTime + " " + "GMT",
              endTime: event.endTime + " " + "GMT",
            };
            if (event.isPrivate) {
              this.eventService.csvInvite(organizerData, [event]);
            }
            this.notificationEngine.eventTicketSaleStart(organizer, data);
          })
        );
        this.loggingService.log(LOG_MESSAGES.EVENT_SALE_STARTED_SUCCESSFULLY);
      }
    }
    finally {
      await this.redisHelperService.unlock(key);
    }
  }

  @Cron("0 0-23/1 * * *")
  async upcomingEvent() {
    this.loggingService.log("RUNNING EVENT SCHEDULE CRON");
    let currentDate = new Date();
    currentDate = new Date(
      currentDate.setUTCHours(currentDate.getUTCHours() + 12, 0, 0, 0)
    );
    let currentDateafterHour = new Date(currentDate);
    currentDateafterHour.setUTCHours(currentDate.getUTCHours() + 1, 0, 0, 0);
    const events = await this.EventModel.aggregate([
      {
        $addFields: {
          startDate: {
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
        $match: {
          startDate: {
            $gte: currentDate,
            $lt: currentDateafterHour,
          },
          isDeleted: false,
        },
      },
    ]);
    //  Update the status of the found events
    if (events.length > 0) {
      await Promise.all(
        events.map(async (event, index) => {
          let ownership = await this.ownershipModel.aggregate([
            { $match: { event: new ObjectId(event._id), isDeleted: false } },
            {
              $lookup: {
                from: "organizers",
                localField: "ownerId",
                foreignField: "_id",
                pipeline: [
                  { $project: { userId: 1, email: 1, name: 1, _id: 0 } },
                ],
                as: "Organizer",
              },
            },
            {
              $unwind: {
                path: "$Organizer",
                preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
              },
            },
            {
              $lookup: {
                from: "events",
                localField: "event",
                foreignField: "_id",
                as: "Event",
              },
            },
            {
              $unwind: {
                path: "$Event",
                preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
              },
            },
            {
              $lookup: {
                from: "artists",
                localField: "ownerId",
                foreignField: "_id",
                pipeline: [
                  { $project: { userId: 1, email: 1, name: 1, _id: 0 } },
                ],
                as: "Artist",
              },
            },
            {
              $unwind: {
                path: "$Artist",
                preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
              },
            },
            {
              $lookup: {
                from: "advertisers",
                localField: "ownerId",
                foreignField: "_id",
                pipeline: [
                  { $project: { userId: 1, email: 1, name: 1, _id: 0 } },
                ],
                as: "Advertiser",
              },
            },
            {
              $unwind: {
                path: "$Advertiser",
                preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
              },
            },
            {
              $lookup: {
                from: "vendors",
                localField: "ownerId",
                foreignField: "_id",
                pipeline: [
                  { $project: { userId: 1, email: 1, name: 1, _id: 0 } },
                ],
                as: "Vendor",
              },
            },
            {
              $unwind: {
                path: "$Vendor",
                preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
              },
            },

            {
              $project: {
                type: 1,
                Organizer: 1,
                Event: 1,
                User: {
                  $ifNull: [
                    "$Artist",
                    {
                      $ifNull: ["$Advertiser", "$Vendor"],
                    },
                  ],
                },
              },
            },
          ]);
          if (ownership.length > 0) {
            ownership.map((owner, index) => {
              if (owner.type === ROLES.EVENT_ORGANIZER) {
                let organizer = {
                  userId: owner?.Organizer?.userId,
                  email: owner?.Organizer?.email,
                };
                let data = {
                  organizerName: owner?.Organizer?.name,
                  eventName: owner?.Event?.eventName,
                  startDate: moment
                    .utc(owner?.Event?.startDate)
                    .format(FORMAT_DATE.DATE_FORMAT),
                  startTime: owner?.Event?.startTime,
                  endTime: owner?.Event?.endTime + " " + "GMT",
                };
                this.notificationEngine.organizerUpcomingEvent(organizer, data);
              } else {
                let user = {
                  userId: owner?.User?.userId,
                  email: owner?.User?.email,
                };
                let data = {
                  userName: owner?.User?.name,
                  eventName: owner?.Event?.eventName,
                  startDate: moment
                    .utc(owner?.Event?.startDate)
                    .format(FORMAT_DATE.DATE_FORMAT),
                  startTime: owner?.Event?.startTime,
                  endTime: owner?.Event?.endTime + " " + "GMT",
                };
                this.notificationEngine.artistupcomingEvent(user, data);
              }
            });
          }
        })
      );

      // Call attendee panel to send attendee event reminder mails
      const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${this.config.get("ATTENDEE_BACKEND_URL")}/event-reminder`,
        data: { events: events.map((e: any) => e._id) },
        headers: {
          "x-client-secret": this.config.get("PEM_CLIENT_SECRET"),
        },
      };
      await axios(config);

      this.loggingService.log(LOG_MESSAGES.EVENT_SALE_ENDED_SUCCESSFULLY);
    }
  }

  @Cron("*/33 * * * *") // every 33th minute
  async updateEventStatus() {
    /* Creating a new key based on event status */
    const key = `UPDATE_STATUS_${new Date(new Date().setUTCSeconds(0, 0))}`;
    /* Lock the generated key. */
    const lockAcquired = await this.redisHelperService.acquireLock(key);
    if (!lockAcquired) {
      this.loggingService.log(`Resource is locked EVENT_STATUS is not updated. - ${new Date()}`);
      return
    }
    try {
      this.loggingService.log("RUNNING EVENT STAUTUS UPDATE SCHEDULE CRON");

      /* 
      * Here the cron runs at 33 minute which will not effect the db.
      * so we are subtracting 3 min from the UTC so we can get the actual time compared to the DB. 
      */
      let currentDateAndTime = new Date();
      currentDateAndTime.setUTCDate(currentDateAndTime.getUTCDate());
      currentDateAndTime.setUTCHours(currentDateAndTime.getUTCHours(), currentDateAndTime.getUTCMinutes() - 3, 0, 0);

      const events = await this.EventModel.aggregate([
        {
          $match: {
            isDeleted: false,
            eventStatus: { $in: [EVENT_STATUS.LIVE, EVENT_STATUS.SALESTARTED, null, ''] },
          }
        },
        {
          $addFields: {
            startDate: {
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
            endDate: {
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
            isMultiDay: {
              $cond: {
                if: { $eq: [{ $dateToString: { format: FORMAT_DATE.DATE, date: "$endDate" } }, { $dateToString: { format: FORMAT_DATE.DATE, date: "$startDate" } }] },
                then: false, /* Single Day Event / Event is ending today. */
                else: true /* Multi Day event. */
              }
            }
          },
        },
        {
          $facet: {
            live: [
              {
                $match: {
                  eventStatus: EVENT_STATUS.LIVE,
                  endDate: {
                    $lte: currentDateAndTime
                  }
                }
              },
              {
                $project: {
                  isMultiDay: 1,
                  eventStatus: 1
                }
              }
            ],
            saleStarted: [
              {
                $match: {
                  eventStatus: {$in: [EVENT_STATUS.SALESTARTED, null, '']},
                  startDate: {
                    $lte: currentDateAndTime,
                  }
                }
              },
              {
                $project: {
                  isMultiDay: 1,
                  eventStatus: 1
                }
              }
            ],
          }
        }
      ]);

      /* If event's does not have any length. */
      if (!events.length) return;

      /* unwinding event. */
      const event = events[0];

      /* All the bulk operations would be stored here. */
      let bulkOps = [];

      /* Check if event live status is not updated. */
      if (event?.live?.length) {
        /* Unwinding live array. */
        let _events = event.live;

        _events.map((event) => (bulkOps.push({
          updateMany: {
            filter: { _id: event._id },
            update: { $set: { eventStatus: _events?.isMultiDay ? EVENT_STATUS.CANCELLED : EVENT_STATUS.COMPLETED } },
          },
        })));

        /* If in live, event is multiday then cancelled or else the status would be completed for a single day event. */
      }
      if (event?.saleStarted?.length) {
        /* If event is salestarted then single/multi whatever it is the status should cancelled. */
        let _events = event.saleStarted;

        _events.map((event) => (
          bulkOps.push({
            updateMany: {
              filter: { _id: event._id },
              update: { $set: { eventStatus: EVENT_STATUS.CANCELLED } },
            },
          })));
      }

      /* updating in db and sending a kafka call. */
      const res = await this.EventModel.bulkWrite(bulkOps);
      this.loggingService.log(`SUCCESSFULLY UPDATED EVENT STATUS CRON...:=>${JSON.stringify(res)}`);

      this.callKafka(bulkOps);

    } finally {
      await this.redisHelperService.unlock(key);
    }
  }

  async callKafka(data) {
    if (data.length) {
      await this.kafkaService.sendMessage(
        this.config.getKafkaTopic("CRON_EVENTS_UPDATE"),
        data
      );
    } else {
      this.loggingService.log(`No event's status was updated everything is uptodate.... `);
    }
  }
}





