import { Injectable, OnModuleInit } from "@nestjs/common";
import { Kafka, Producer, Consumer, SASLOptions } from "kafkajs";
import { LoggingService } from "../logging/logging.service";
import { ConfigurationService } from "../config/config.service";
import { InjectModel } from "@nestjs/mongoose";
import { Vendor } from "../database/entities/vendor.entity";
import { Model } from "mongoose";
import { Event } from "../database/entities/events.entity";
import { Organizer } from "../database/entities/organizer.entity";
import { NotificationEngine } from "../services/notification_engine";
import { Banner } from "../database/entities/banner.entity";
import { Props } from "../database/entities/meta.entities";
import { Venue } from "../database/entities/meta/venue.entity";
import { Ownership } from "../database/entities/meta/ownership.entity";
import { Kiosk } from "../database/entities/kiosk.entity";
import { VendorEvent } from "../database/entities/vendorEvent.entity";
import { Artist } from "../database/entities/artist.entity";
import {
  ARTIST_PROGRESS,
  DEBATE_STATUS,
  ERROR_MESSAGES,
  EVENT_STATUS,
  KYC_STATUS,
  LOG_MESSAGES,
  PROGRESS_ORGANIZER,
  ROLES,
  SUCCESS_MESSAGE,
  VENDOR_PROGRESS,
} from "../config/constants";
import { Gallery } from "../database/entities/gallery.entity";
import { Analytics } from "../database/entities/analytics.entity";
import { EventDebatePolls } from "../database/entities/debatepolls.entity";
const { ObjectId } = require("mongodb");
@Injectable()
export class KafkaService implements OnModuleInit {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor(
    private loggingService: LoggingService,
    private config: ConfigurationService,
    private readonly notificationEngine: NotificationEngine,
    @InjectModel(Event.name)
    private readonly EventModel: Model<Event>,
    @InjectModel(EventDebatePolls.name)
    private readonly pollSchema: Model<EventDebatePolls>,
    @InjectModel(Vendor.name)
    private readonly VendorModel: Model<Vendor>,
    @InjectModel(Organizer.name)
    private readonly organizerModel: Model<Organizer>,
    @InjectModel(Artist.name)
    private readonly artistModel: Model<Artist>,
    @InjectModel(Ownership.name)
    private readonly ownershipModel: Model<Ownership>,
    @InjectModel(Banner.name)
    private readonly bannerModel: Model<Banner>,
    @InjectModel(Gallery.name)
    private readonly GalleryModel: Model<Gallery>
  ) {
    // Define SASL configuration
    const sasl: SASLOptions = {
      mechanism: this.config.get("SASL_MECHANISM"),
      username: this.config.get("KAFKA_USERNAME"),
      password: this.config.get("KAFKA_PASSWORD"),
    };
    const RAND_GROUP_ID = Date.now();
    // Create a Kafka instance
    this.kafka = new Kafka({
      clientId: this.config.get("KAFKA_CLIENTID") + RAND_GROUP_ID,
      brokers: [
        this.config.get("KAFKA_BROKER1"),
        this.config.get("KAFKA_BROKER2"),
        this.config.get("KAFKA_BROKER3"),
      ],
      ssl: false,
      sasl,
    });

    // Create a Kafka producer
    this.producer = this.kafka.producer();
    // Create a Kafka consumer
    this.consumer = this.kafka.consumer({
      groupId:
        this.config.get("KAFKA_CLIENTID") +
        "CONSUMER-" +
        this.config.getKafkaGroupId(),
    });
  }

  async onModuleInit() {
    await this.consumer.connect();
    /*consumer intiated.*/
    await this.consumer.subscribe({
      topic: this.config.getKafkaTopic("UPDATE_EVENTS_TICKETS"),
    });

    await this.consumer.subscribe({
      topic: this.config.getKafkaTopic("BANNER_UPDATE"),
    });
    await this.consumer.subscribe({
      topic: this.config.getKafkaTopic("PROPS_UPDATE"),
    });
    await this.consumer.subscribe({
      topic: this.config.getKafkaTopic("VENDOR_STATUS"),
    });
    await this.consumer.subscribe({
      topic: this.config.getKafkaTopic("EVENTS_LIVE_START"),
    });
    await this.consumer.subscribe({
      topic: this.config.getKafkaTopic("VENDOR_ORGANZIED"),
    });
    await this.consumer.subscribe({
      topic: this.config.getKafkaTopic("ASSET_BANNER"),
    });
    await this.consumer.subscribe({
      topic: this.config.getKafkaTopic("DELETE_REASSIGN_BANNER"),
    });
    await this.consumer.subscribe({
      topic: this.config.getKafkaTopic("USER_GALLERY_UPDATE"),
    });
    this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        this.loggingService.log(
          `${SUCCESS_MESSAGE.KAFKA_CONSUMER_INITIATED_SUCCESSFULLY
          } ${topic} and partition: ${partition} and value : ${JSON.stringify(
            message.value.toString()
          )}`
        );

        switch (topic) {
          case this.config.getKafkaTopic("UPDATE_EVENTS_TICKETS"):
            await this.updateTickets(JSON.parse(message.value.toString()));
            break;
          case this.config.getKafkaTopic("VENDOR_STATUS"):
            await this.updateVendor(
              JSON.parse(message.value.toString())
            ); /*After Set Password. set emailVerifed = true.*/
            break;
          case this.config.getKafkaTopic("BANNER_UPDATE"):
            await this.updateBanner(JSON.parse(message.value.toString()));
            break;
          case this.config.getKafkaTopic("PROPS_UPDATE"):
            await this.updateProps(JSON.parse(message.value.toString()));
            break;
          case this.config.getKafkaTopic("ASSET_BANNER"):
            await this.updateOwnerShips(JSON.parse(message.value.toString()));
            break;
          case this.config.getKafkaTopic("EVENTS_LIVE_START"):
            await this.updateLiveStatus(JSON.parse(message.value.toString()));
            break;
          case this.config.getKafkaTopic("VENDOR_ORGANZIED"):
            await this.updateVendorkIosk(JSON.parse(message.value.toString()));
            break;
          case this.config.getKafkaTopic("USER_GALLERY_UPDATE"):
            await this.galleryUpdate(JSON.parse(message.value.toString()));
            break;
          case this.config.getKafkaTopic("DELETE_REASSIGN_BANNER"):
            await this.updateBannerAfterOwnershipDeleted(
              JSON.parse(message.value.toString())
            );
            break;
        }
      },
    });
  }

  async galleryUpdate(Data: any) {
    try {
      this.loggingService.log(
        `Saving Gallery with details :${JSON.stringify(Data)}`
      );
      const galleryRoles = [
        "EVENT_ORGANIZER",
        "EVENT_ARTIST",
        "EVENT_ADVERTISER",
      ];
      function modifyIdToObject(mediaArray) {
        for (const media of mediaArray) {
          if (typeof media._id === 'string') {
            media._id = new ObjectId(media._id)
          }
        }
      }
      modifyIdToObject(Data.media);
      if (galleryRoles.includes(Data.roles[0])) {
        if (Data.isNew) {
          let json = {
            user: new ObjectId(Data.user),
            event: new ObjectId(Data.event),
            media: Data.media,
          };
          await new this.GalleryModel(json).save();
        } else {
          await this.GalleryModel.findOneAndUpdate(
            {
              user: new ObjectId(Data.user),
              event: new ObjectId(Data.event),
            },
            {
              media: Data.media,
            },
            {
              new: true,
            }
          );
        }
      }
    } catch (error) {
      this.loggingService.error("Error while updating user gallery", error);
    }
  }

  async updateBannerAfterOwnershipDeleted(data: any) {
    try {
      let { deleted, reassigned } = data?.data;
      if (data.isOrganizer) {
        if (deleted.length) {
          await this.bannerModel.deleteMany({
            _id: {
              $in: deleted.map((banner) => banner),
            },
            event: new ObjectId(data.event),
          });
        }
        if (reassigned.length) {
          await this.bannerModel.updateMany(
            {
              _id: {
                $in: reassigned.map((banner) => new ObjectId(banner)),
              },
              event: new ObjectId(data.event),
            },
            { $set: { owner: new ObjectId(data.organizerId) } }
          );
        }
      }
    } catch (error) {
      this.loggingService.error("Error while updating user gallery", error);
    }
  }

  async updateVendorkIosk(data) {
    const updateObject = {};
    let event = await this.EventModel.findOne({
      _id: data.event,
      isDeleted: false,
    }).populate("eventStatus");
    if (event) {
      if (event.eventStatus) {
        this.loggingService.error(
          ERROR_MESSAGES.ADDING_DETAILS_AFTER_SALE_START,
          "while updating the props"
        );
      } else {
        if (data?.isKiosksOrganized) {
          updateObject["$addToSet"] = {
            progress: [VENDOR_PROGRESS.ASSIGNEDPRODUCTS],
          };
        } else if (data?.isBannersOrganized) {
          updateObject["$addToSet"] = {
            progress: [VENDOR_PROGRESS.ORGANIZEBANNER],
          };
        } else if (data?.isBannersExists != null && data?.isBannersExists === false) {
          updateObject["$addToSet"] = {
            progress: [
              VENDOR_PROGRESS.ORGANIZEBANNER,
              VENDOR_PROGRESS.UPLOADBANNER,
            ],
          };
        }
        else if (data?.isKiosksOrganized == false) {
          updateObject["$pull"] = {
            progress: VENDOR_PROGRESS.ASSIGNEDPRODUCTS,
          };
        } else if (data?.isBannersOrganized === false && data?.isBannersExists) {
          updateObject["$pull"] = { progress: VENDOR_PROGRESS.ORGANIZEBANNER };
        }
        await this.ownershipModel.updateOne(
          {
            event: new ObjectId(data.event),
            ownerId: new ObjectId(data.ownerId),
            isDeleted: false,
          },
          updateObject
        );
      }
    } else {
      this.loggingService.error(
        ERROR_MESSAGES.INVALID_EVENT_ID,
        "whiling updating props"
      );
    }
  }

  async updateOwnerShips(ownerData) {
    let event = await this.EventModel.findOne({
      _id: ownerData[0].event,
      isDeleted: false,
    }).populate("eventStatus");
    if (event) {
      if (event.eventStatus) {
        this.loggingService.error(
          ERROR_MESSAGES.ADDING_DETAILS_AFTER_SALE_START,
          "while updating the props"
        );
      } else {
        ownerData = ownerData[0];
        ownerData.assets.forEach((asset) => {
          asset._id = new ObjectId(asset._id);
        });
        ownerData.ownerAssets.forEach((asset) => {
          asset._id = new ObjectId(asset._id);
        });
        let pipeline =
          ownerData?.ownerAssets && ownerData.ownerAssets.length
            ? {
              ownerAssets: ownerData?.ownerAssets,
              $addToSet: {
                progress: VENDOR_PROGRESS.UPLOADBANNER,
              },
            }
            : {
              ownerAssets: [],
              $pull: { progress: { $in: [VENDOR_PROGRESS.UPLOADBANNER] } },
            };
        const result = await this.ownershipModel.findOneAndUpdate(
          {
            _id: new ObjectId(ownerData?._id),
            type: ROLES.EVENT_VENDOR,
            isDeleted: false,
          },
          pipeline
        );
        this.loggingService.log(
          `${SUCCESS_MESSAGE.OWNER_KAFKA_UPDATED_SUCCESSFULLY} ${result}`
        );
      }
    } else {
      this.loggingService.error(
        ERROR_MESSAGES.INVALID_EVENT_ID,
        "whiling updating props"
      );
    }
  }

  async updateProps(propsData) {
    let event = await this.EventModel.findOne({
      _id: propsData?.event,
      isDeleted: false,
    }).populate("eventStatus");
    if (!!propsData.event && propsData.role == ROLES.EVENT_ORGANIZER) {
      let response = await this.EventModel.findOneAndUpdate(
        {
          _id: new ObjectId(propsData?.event),
          isDeleted: false,
        },
        {
          $addToSet: {
            progress: { $each: [PROGRESS_ORGANIZER.STAGE] },
          },
        },
        { new: true }
      );
    } else if (!!propsData.owner && propsData.role == ROLES.EVENT_ARTIST) {
      let owner = await this.artistModel.findOne({ userId: propsData.owner });
      await this.ownershipModel.findOneAndUpdate(
        {
          event: new ObjectId(propsData?.event),
          ownerId: new ObjectId(owner._id),
          isDeleted: false,
        },
        {
          $addToSet: {
            progress: { $each: [ARTIST_PROGRESS.STAGE] },
          },
        },
        { new: true }
      );
    }
  }

  async updateBanner(bannersData) {
    bannersData.data = bannersData.data.filter((item) => item !== null);
    if (
      bannersData.isMedia &&
      bannersData.role != ROLES.EVENT_VENDOR &&
      bannersData.data != null
    ) {
      if (Array.isArray(bannersData.data)) {
        for (const bannerData of bannersData.data) {
          let bnners = await this.bannerModel.findByIdAndUpdate(
            bannerData._id,
            { $set: { media: bannerData.media } },
            { new: true }
          );
        }
      }
      if (bannersData.role == ROLES.EVENT_ORGANIZER) {
        const uniqueOwners = [
          ...new Set(bannersData.data.map((item) => item.owner)),
        ];
        for (const bannerData of uniqueOwners) {
          await this.updateOwnershipModel(bannersData.event, bannerData, true);
        }
      } else {
        await this.updateOwnershipModel(bannersData.event, bannersData, false);
      }
    } else if (
      !bannersData.isMedia &&
      bannersData.role === ROLES.EVENT_ORGANIZER &&
      bannersData.data != null
    ) {
      if (Array.isArray(bannersData.data)) {
        let fullBanners = [];
        for (const bannerData of bannersData.data) {
          const { metaBanner, owner, event, _id } = bannerData;
          // Append ObjectId to metaBanner, owner, event, and _id
          const bannerToUpdate = {
            ...bannerData,
            metaBanner: new ObjectId(metaBanner),
            owner: new ObjectId(owner),
            event: new ObjectId(event),
            _id: new ObjectId(_id),
          };
          await this.bannerModel.deleteMany({
            name: bannerData.name,
            event: new ObjectId(bannerData?.event),
          });
          fullBanners.push(bannerToUpdate);
          const Banner = await this.bannerModel.deleteMany({
            name: bannerData.name,
            venue: new ObjectId(bannerData.venue),
            event: new ObjectId(bannerData?.event),
          });
        }
        const uniqueOwners = [
          ...new Set(fullBanners.map((item) => item.owner)),
        ];
        await this.bannerModel.insertMany(fullBanners);
        if (bannersData.role === ROLES.EVENT_ORGANIZER) {
          await this.ownershipModel.updateMany(
            { _id: { $in: uniqueOwners.map((owner) => owner) } },
            {
              $pull: {
                progress: ARTIST_PROGRESS.ORGANIZEBANNER,
              },
            }
          );
          let ownership = await this.ownershipModel.aggregate([
            {
              $match: {
                isDeleted: false,
                event: new ObjectId(bannersData.event),
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
                      event: new ObjectId(bannersData.event),
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
              new ObjectId(bannersData?.event),
              {
                $addToSet: {
                  progress: { $each: [PROGRESS_ORGANIZER.ASSIGNBANNER] },
                },
              },
              { new: true }
            );
          } else {
            await this.EventModel.findByIdAndUpdate(
              new ObjectId(bannersData?.event),
              {
                $pull: {
                  progress: PROGRESS_ORGANIZER.ASSIGNBANNER,
                },
              },
              { new: true }
            );
          }
        }
      }
    }
  }

  async updateOwnershipModel(event, owner, isEventOrganizer) {
    try {
      let banners;
      let id = isEventOrganizer ? owner : owner.ownershipId;
      if (isEventOrganizer) {
        await this.ownershipModel.updateOne(
          { _id: new ObjectId(owner) },
          {
            $addToSet: {
              orgProgress: { $each: [ARTIST_PROGRESS.ORGANIZEBANNER] },
            },
          }
        );
      }
      banners = await this.bannerModel.aggregate([
        {
          $match: {
            isDeleted: false,
            event: new ObjectId(event),
            owner: new ObjectId(id),
          },
        },
        {
          $addFields: {
            hasMedia: {
              $cond: {
                if: { $gt: [{ $size: "$media" }, 0] },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            allHasMedia: { $min: "$hasMedia" },
          },
        },
        {
          $project: {
            _id: 0,
            result: "$allHasMedia",
          },
        },
      ]);
      const commonUpdateCriteria = {
        event: new ObjectId(event),
        _id: new ObjectId(id),
        isDeleted: false,
      };
      const updateObject = banners[0]?.result
        ? {
          $addToSet: {
            progress: ARTIST_PROGRESS.ORGANIZEBANNER,
          },
        }
        : {
          $pull: {
            progress: ARTIST_PROGRESS.ORGANIZEBANNER,
          },
        };
      await this.ownershipModel.updateOne(commonUpdateCriteria, updateObject, {
        new: true,
      });
    } catch (error) {
      this.loggingService.error(
        "Error while updating organize banner progress",
        error
      );
    }
  }

  async updateVendor(vendorData) {
    if (vendorData?.isEmailVerified) {
      let vendorDetails = await this.VendorModel.findOneAndUpdate(
        { userId: vendorData.userId },
        {
          isEmailVerified: true,
        }
      );
      let organizerDetials = await this.organizerModel.findOne({
        userId: vendorDetails.organizer,
      });
      let organizer = {
        userId: organizerDetials?.userId,
        email: organizerDetials?.email,
      };
      let data = {
        organizerName: organizerDetials?.name ? organizerDetials?.name : "User",
        vendorName: vendorDetails?.name ? vendorDetails?.name : "User",
      };
      this.notificationEngine.vendorOnboarded(organizer, data);
    }
    if (!!vendorData.kycStatus) {
      await this.VendorModel.findOneAndUpdate(
        { userId: vendorData.userId },
        {
          isKYCVerified: vendorData.isKybCompleted,
          kycStatus: vendorData.kycStatus,
        }
      );
    }
  }

  async updateTickets(ticketData) {
    try {
      if (ticketData?.isTicketUpdate) {
        const operations = ticketData?.data.map((ticket) => {
          return {
            updateOne: {
              filter: { _id: new ObjectId(ticket._id) },
              update: { $set: { ticketsLeft: ticket.ticketsLeft } },
              upsert: false,
            },
          };
        });

        const updatedResult = await this.EventModel.bulkWrite(operations);
        this.loggingService.log(`UPDATED EVENTS TICKET_LEFT ${updatedResult}`);
      }
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_WHILE_TICKET_SAVE, error);
    }
  }

  async updateLiveStatus(eventLiveData) {
    this.loggingService.log(
      `${LOG_MESSAGES.LOG_EVENT_STATUS_CALL} ${eventLiveData.eventStatus} ${eventLiveData.eventId}`
    );
    if (eventLiveData?.eventStatus === EVENT_STATUS.LIVE) {
      await this.EventModel.updateMany(
        { _id: eventLiveData.eventId?.map((event) => new ObjectId(event)) },
        {
          eventStatus: EVENT_STATUS.LIVE,
        },
        { new: true }
      );
    } else if (eventLiveData?.eventStatus === EVENT_STATUS.ONGOING) {
      await this.EventModel.updateMany(
        { _id: eventLiveData.eventId?.map((event) => new ObjectId(event)) },
        {
          eventStatus: EVENT_STATUS.ONGOING,
        },
        { new: true }
      );
    }
    else if (eventLiveData?.eventStatus === EVENT_STATUS.COMPLETED) {
      await this.EventModel.updateMany(
        { _id: eventLiveData.eventId?.map((event) => new ObjectId(event)) },
        {
          eventStatus: EVENT_STATUS.COMPLETED,
        },
        { new: true }
      );

      await this.pollSchema.updateMany(
        { eventId: eventLiveData.eventId?.map((event) => new ObjectId(event)), status: DEBATE_STATUS.ACTIVE },
        { status: EVENT_STATUS.COMPLETED }
      );

    }
  }

  async sendMessage(topic: string, data: any) {
    this.loggingService.log(
      `${SUCCESS_MESSAGE.KAFKA_PRODUCER_INITIATED_SUCCESSFULLY
      } ${topic} and value : ${JSON.stringify(data)}`
    );
    await this.producer.connect();

    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(data) }],
    });
    setTimeout(async () => {
      await this.producer.disconnect();
    }, 5000);
  }
}
