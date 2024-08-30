import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { LoggingService } from "src/common/logging/logging.service";
import { ErrorService } from "src/common/services/errorService";
import { Vendor } from "src/common/database/entities/vendor.entity";
import { Kiosk } from "src/common/database/entities/kiosk.entity";
import { assignKioskInputType } from "./dto/vendor.input_types";
import { Event } from "src/common/database/entities/events.entity";
import { PaginationInput } from "src/common/shared/common.input_type";
import { VendorEvent } from "src/common/database/entities/vendorEvent.entity";
import { ConfigurationService } from "src/common/config/config.service";
import { Venue } from "src/common/database/entities/meta/venue.entity";
import { MetaKiosk } from "src/common/database/entities/meta/metakiosk.entity";
import { OnwershipService } from "src/common/services/ownershipService";
import { KafkaService } from "src/common/kafka/kafka.service";
import {
  ERROR_MESSAGES,
  EVENT_STATUS,
  ROLES,
  SUCCESS_MESSAGE,
  VENDOR_PROGRESS,
} from "src/common/config/constants";
import { checkEventBeforeUpdatingDetails } from "src/common/helper/helper";
const moment = require("moment");
require("moment-timezone");
const { ObjectId } = require("mongodb");
@Injectable()
export class VendorService {
  vendorToken: string;
  constructor(
    private readonly errorService: ErrorService,
    private readonly ownershipEngine: OnwershipService,
    @InjectModel(Vendor.name)
    private readonly VendorModel: Model<Vendor>,
    @InjectModel(Event.name)
    private readonly EventModel: Model<Event>,
    @InjectModel(VendorEvent.name)
    private readonly VendorEventModel: Model<VendorEvent>,
    @InjectModel(Venue.name)
    private readonly VenueModel: Model<Venue>,
    @InjectModel(Kiosk.name)
    private readonly kioskModel: Model<Kiosk>,
    @InjectModel(MetaKiosk.name)
    private readonly metaKioskModel: Model<MetaKiosk>,
    private readonly config: ConfigurationService,
    private readonly kafkaService: KafkaService
  ) {}

  async getEventDetails(eventId, loginResponse, checkEventCategory) {
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
            _id: 1,
            startDate: 1,
            startTime: 1,
            endTime: 1,
            endDate: 1,
            duration: 1,
            eventStatus: 1,
            venue :1,
            eventName : 1,
            status: 1,
            category: { $arrayElemAt: ["$eventCategory.eventCategory", 0] }
          },
        },

      ]);
      //throw error if event category is Debate and trying to fetch / update the detials
      checkEventBeforeUpdatingDetails(event, checkEventCategory)

      return event
    } catch (error) {
      this.errorService.error({ message: error }, 400)
    }
  }

  async getVendors(name: string, eventId: string, loginResponse: any) {
    try {
      // Check if the event exists and is associated with the organizer
      const isEventExist = await this.getEventDetails(eventId, loginResponse, true)
      const pipeline = [];
      let search = {};
      if (name) {
        search = {
          $search: {
            index: "searchByVendorName",
            autocomplete: {
              query: name,
              path: "orgName",
            },
          },
        };
        pipeline.push(search);
      }
      let lookup = {
        $lookup: {
          from: "ownerships",
          localField: "_id",
          foreignField: "ownerId",
          pipeline: [
            { $match: { event: new ObjectId(eventId), isDeleted: false } },
            { $project: { ownerId: 1, isDeleted: 1 } },
          ],
          as: "vendor",
        },
      };
      let match = {};
      match = {
        $match: { vendor: { $eq: [] } },
      };
      let project = {};
      project = {
        $project: { orgName: 1, isKYCVerified: 1, isDeleted: 1 },
      };
      pipeline.push(lookup);
      pipeline.push(match);
      pipeline.push(project);
      const vendors = await this.VendorModel.aggregate(pipeline);
      return { response: vendors };
    } catch (error) {
      const errorCode = error?.status || 400;
      this.errorService.error({ message: error }, errorCode);
      LoggingService.error(ERROR_MESSAGES.UNABLE_TO_FETCH_EVENT_DETAILS, error);
      return error;
    }
  }

  async getKiosks(eventId: String, loginResponse: any) {
    try {
      // Check if the event exists and is associated with the organizer
      const isEventExist = await this.getEventDetails(eventId, loginResponse, true)
      let venueId = isEventExist.venue;
      const eventvenue = await this.VendorEventModel.aggregate([
        {
          $match: { event: new ObjectId(eventId), isDeleted: false },
        },
        {
          $group: {
            _id: null,
            mergedArray: { $push: "$activeKiosks" },
          },
        },
        {
          $project: {
            _id: 0,
            mergedArray: {
              $reduce: {
                input: "$mergedArray",
                initialValue: [],
                in: { $concatArrays: ["$$value", "$$this"] },
              },
            },
          },
        },
      ]);
      const venue = await this.VenueModel.aggregate([
        { $match: { _id: new ObjectId(venueId) } },
        {
          $lookup: {
            from: "metakiosks",
            localField: "kiosks",
            foreignField: "_id",
            pipeline: [
              {
                $match: {
                  _id: {
                    $not: {
                      $in: eventvenue[0]?.mergedArray || [],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  kioskName: "$name",
                  thumbnailUrl: 1,
                  dimensions: 1,
                },
              },
            ],
            as: "kiosks",
          },
        },
      ]);
      if (!venue.length) {
        return new Error(ERROR_MESSAGES.VENUE_ID_NOT_FOUND);
      }
      return { kioskDetails: venue[0].kiosks };
    } catch (error) {
      const errorCode = error?.status || 400;
      this.errorService.error({ message: error }, errorCode);
      LoggingService.error(ERROR_MESSAGES.UNABLE_TO_FETCH_EVENT_DETAILS, error);
      return error;
    }
  }

  async assignKiosk(
    input: assignKioskInputType,
    loginResponse: any,
    userTimeZone
  ) {
    try {
      let kioskIds = input.kioskIds.map((id) => {
        return new ObjectId(id);
      });
      // Check if the event exists and is associated with the organizer
      const isEventExist = await this.getEventDetails(input.eventId, loginResponse, true)
      let vendor = await this.VendorModel.findById(input.vendorId);
      if (!vendor) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.VENDOR_NOT_FOUND_IN_EVENT,
          },
          400
        );
      }
      input.venueId = isEventExist.venue;
      const venue = await this.VenueModel.aggregate([
        {
          $match: {
            _id: new ObjectId(input.venueId),
          },
        },
        {
          $addFields: {
            valid: {
              $eq: [
                {
                  $size: {
                    $setDifference: [kioskIds, "$kiosks"],
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $match: { valid: true },
        },
        {
          $project: {
            kiosks: 1,
            validKiosks: 1,
          },
        },
      ]);
      if (venue.length === 0) {
        return new Error(ERROR_MESSAGES.KIOSKS_OR_VENUE_NOT_FOUND);
      }
      let vendors = await this.VendorEventModel.aggregate([
        {
          $match: {
            event: new ObjectId(input.eventId),
            venue: new ObjectId(input.venueId),
            vendor: { $ne: new ObjectId(input.vendorId) },
            isDeleted: false,
          },
        },
        {
          $addFields: {
            valid: {
              $gt: [
                {
                  $size: {
                    $setIntersection: ["$activeKiosks", kioskIds],
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $match: { valid: true },
        },
      ]);

      if (vendors.length) {
        return new Error(ERROR_MESSAGES.KIOSKS_ALREADY_ASSIGNED);
      }

      let vendorExists = await this.VendorEventModel.findOne({
        event: new ObjectId(input.eventId),
        vendor: new ObjectId(input.vendorId),
        isDeleted: false,
      });
      let response = {};
      if (vendorExists) {
        response = await this.VendorEventModel.findByIdAndUpdate(
          vendorExists._id,
          {
            activeKiosks: kioskIds,
            updatedBy: loginResponse._id,
            updatedAt: new Date(),
          },
          {
            new: true,
          }
        );
        response["message"] = SUCCESS_MESSAGE.KIOSKS_UPDATED_TO_VENDOR;
      } else {
        const newVendorEvent = new this.VendorEventModel();
        newVendorEvent.createdBy = loginResponse._id;
        newVendorEvent.activeKiosks = kioskIds;
        newVendorEvent.event = isEventExist._id;
        newVendorEvent.vendor = new ObjectId(input.vendorId);
        newVendorEvent.venue = new ObjectId(input.venueId);
        newVendorEvent.createdAt = new Date();
        response = await newVendorEvent.save();
        response["message"] = SUCCESS_MESSAGE.KIOSKS_ASSIGNED_TO_VENDOR;
      }
      // assing kiosks to vendor under event
      let startDate = isEventExist.startDate;
      let endDate = isEventExist.endDate;
      let startTime = isEventExist.startTime;
      let EventstartDate = new Date(startDate);
      let [hours, minutes] = startTime.split(":").map(Number);
      let EventendDate = new Date(endDate);
      EventstartDate = new Date(
        EventstartDate.setUTCHours(hours, minutes, 0, 0)
      );
      EventendDate = new Date(
        EventendDate.setUTCHours(hours + isEventExist.duration, minutes, 0, 0)
      );
      let ownership_data = {
        ownerId: new ObjectId(input.vendorId),
        event: new ObjectId(input.eventId),
        name: vendor.orgName,
        type: ROLES.EVENT_VENDOR,
        eventName: isEventExist.eventName,
        assets: [],
        ownerAssets: [],
        timeSlot: [{ startTime: EventstartDate, endTime: EventendDate }],
      };
      let owner = await this.ownershipEngine.addOwnership(
        ownership_data,
        userTimeZone
      );
      await this.EventModel.findByIdAndUpdate(
        input.eventId,
        {
          $addToSet: { progress: { $each: ["VENDOR"] } },
        },
        { new: true }
      );
      await this.EventModel.findByIdAndUpdate(
        input.eventId,
        {
          $pull: { progress: VENDOR_PROGRESS.ORGANIZEBANNER },
        },
        { new: true }
      );
      response["isOk"] = true;
      //sending event data to vendor panel
      await this.kafkaService.sendMessage(
        this.config.getKafkaTopic("ASSIGN_KIOSK"),
        {
          response,
          eventName: isEventExist.eventName,
          ownership: owner ? owner : null,
        }
      );
      return response;
    } catch (error) {
      const errorCode = error?.status || 400;
      this.errorService.error({ message: error }, errorCode);
      LoggingService.error(ERROR_MESSAGES.UNABLE_TO_FETCH_EVENT_DETAILS, error);
      return error;
    }
  }

  async getVendorsKisosks(
    eventId: string,
    vendorId: string,
    loginResponse: any
  ) {
    try {
      
      // Check if the event exists and is associated with the organizer
      await this.getEventDetails(eventId, loginResponse, true)

      const vendorMatchPipeline = [
        {
          $match: {
            event: new ObjectId(eventId),
            vendor: new ObjectId(vendorId),
            isDeleted: false,
          },
        },
      ];

      const vendorLookup = [
        {
          $lookup: {
            from: "vendors",
            localField: "vendor",
            foreignField: "_id",
            as: "vendor",
          },
        },
        {
          $addFields: {
            vendor: { $arrayElemAt: ["$vendor", 0] },
          },
        },
      ];

      const assignedKiosksPipeline = [
        {
          $lookup: {
            from: "metakiosks",
            // let :{assignedKiosks:'$activeKiosks'},
            localField: "activeKiosks",
            foreignField: "_id",
            pipeline: [
              {
                $addFields: {
                  isAssigned: true,
                },
              },
            ],
            as: "assignedKiosks",
          },
        },
      ];

      const vendorKiosks = await this.VendorEventModel.aggregate([
        ...vendorMatchPipeline,
        ...vendorLookup,
        ...assignedKiosksPipeline,
        {
          $project: {
            _id: 0,
            vendor: 1,
            assignedKiosks: 1,
            venue: 1,
          },
        },
      ]);

      const awailableKiosks = await this.getKiosks(eventId, loginResponse);
      const unAssignedKiosks = await this.metaKioskModel.aggregate([
        {
          $match: {
            _id: { $in: awailableKiosks.kioskDetails.map((k) => k._id) },
          },
        },
        {
          $addFields: {
            isAssigned: false,
          },
        },
      ]);

      if (!vendorKiosks.length) {
        return new Error(ERROR_MESSAGES.VENDOR_NOT_FOUND_IN_EVENT);
      }

      return {
        vendor: vendorKiosks[0].vendor,
        kiosks: [...vendorKiosks[0].assignedKiosks, ...unAssignedKiosks],
      };
    } catch (error) {
      const errorCode = error?.status || 400;
      this.errorService.error({ message: error }, errorCode);
      LoggingService.error(ERROR_MESSAGES.UNABLE_TO_FETCH_EVENT_DETAILS, error);
      return error;
    }
  }

  async getEventVendors(
    eventId: string,
    paginationInput: PaginationInput,
    loginResponse: any
  ) {
    try {
     
      // Check if the event exists and is associated with the organizer
      await this.getEventDetails(eventId, loginResponse, true)
      const skip = paginationInput?.skip ? paginationInput?.skip : 0;
      const limit = paginationInput?.limit ? paginationInput?.limit : 10;

      const eventVendorsPipeline = [
        {
          $lookup: {
            from: "metakiosks",
            localField: "activeKiosks",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  kioskName: "$name",
                  thumbnailUrl: 1,
                },
              },
            ],
            as: "kiosksList",
          },
        },
        {
          $lookup: {
            from: "vendors",
            localField: "vendor",
            foreignField: "_id",
            let: { kiosksList: "$kiosksList" },
            pipeline: [
              {
                $addFields: {
                  kiosksList: "$$kiosksList",
                },
              },
              {
                $project: {
                  orgName: 1,
                  kiosksList: 1,
                  isKYCVerified: 1,
                },
              },
            ],
            as: "vendor",
          },
        },
        {
          $addFields: { vendor: { $arrayElemAt: ["$vendor", 0] } },
        },
        {
          $project: {
            _id: 0,
            vendor: 1,
          },
        },
        {
          $project: {
            _id: "$vendor._id",
            orgName: "$vendor.orgName",
            kiosksList: "$vendor.kiosksList",
          },
        },
      ];

      const eventVendors = await this.VendorEventModel.aggregate([
        {
          $match: {
            event: new ObjectId(eventId),
            isDeleted: false,
          },
        },
        {
          $facet: {
            vendors: [
              ...eventVendorsPipeline,
              { $skip: skip * limit },
              { $limit: limit },
            ],
            vendorsCount: [{ $count: "vendorsCount" }],
          },
        },
      ]);
      return {
        vendorsCount: eventVendors[0].vendorsCount.length
          ? eventVendors[0].vendorsCount[0].vendorsCount
          : 0,
        vendors: eventVendors[0].vendors,
      };
    } catch (error) {
      const errorCode = error?.status || 400;
      this.errorService.error({ message: error }, errorCode);
      LoggingService.error(ERROR_MESSAGES.UNABLE_TO_FETCH_EVENT_DETAILS, error);
      return error;
    }
  }

  async deleteVendor(
    eventId: string,
    vendorId: string,
    loginResponse: any,
    userTimeZone
  ) {
    try {
      const [isEventExist] = await this.EventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            organizer: new ObjectId(loginResponse?.userId),
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
      } else if (
        [EVENT_STATUS.NEW, EVENT_STATUS.DRAFT].includes(isEventExist.status)
      ) {
        return this.errorService.error(
          {
            message: ERROR_MESSAGES.CANNOT_GET_ADVERTISERS_BEFORE_PAYMENT,
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
      const response: any = await this.VendorEventModel.findOneAndDelete({
        event: new ObjectId(eventId),
        vendor: new ObjectId(vendorId),
        isDeleted: false,
      });
      let ownership_data = {
        event: new ObjectId(eventId),
        ownerId: new ObjectId(vendorId),
      };
      let owner = await this.ownershipEngine.deleteOwnership(
        ownership_data,
        userTimeZone
      );
      if (owner === null) {
        return this.errorService.error(
          { message: SUCCESS_MESSAGE.VENDOR_ALREADY_DELETED },
          400
        );
      }
      const vendorEvents = await this.VendorEventModel.aggregate([
        {
          $match: {
            event: new ObjectId(eventId),
            isDeleted: false,
          },
        },
      ]);
      if (!vendorEvents.length) {
        await this.EventModel.findByIdAndUpdate(
          new ObjectId(eventId),
          {
            $pull: { progress: "VENDOR" },
          },
          { new: true }
        );
      }

      await this.kafkaService.sendMessage(
        this.config.getKafkaTopic("ASSIGN_KIOSK"),
        {
          isVendorRemoved: true,
          eventId,
          vendorId,
          organizerId: loginResponse._id,
          ownership: owner,
        }
      );
      (response["message"] = SUCCESS_MESSAGE.VENDOR_DELETED_FROM_EVENT),
        (response["isOk"] = true);
      return response;
    } catch (error) {
      const errorCode = error?.status || 400;
      this.errorService.error({ message: error }, errorCode);
      LoggingService.error(ERROR_MESSAGES.UNABLE_TO_FETCH_EVENT_DETAILS, error);
      return error;
    }
  }
}
