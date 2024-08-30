import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { LoggingService } from "src/common/logging/logging.service";
import { ErrorService } from "src/common/services/errorService";
import { Advertiser } from "src/common/database/entities/advertiser.entity";
import { PaginationInput } from "src/common/shared/common.input_type";
import { Event } from "src/common/database/entities/events.entity";
import { Ownership } from "src/common/database/entities/meta/ownership.entity";
import { OnwershipService } from "src/common/services/ownershipService";
import {
  ERROR_MESSAGES,
  EVENT_STATUS,
  INDEX_NAME,
  LOG_MESSAGES,
  PROGRESS_ORGANIZER,
  ROLES,
  SUCCESS_MESSAGE,
} from "src/common/config/constants";
import { EventService } from "../event/events.service";
import { checkEventBeforeUpdatingDetails } from "src/common/helper/helper";
const { ObjectId } = require("mongodb");

@Injectable()
export class AdvertiserService {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly ownershipEngine: OnwershipService,
    private readonly errorService: ErrorService,
    private readonly eventService: EventService,
    @InjectModel(Advertiser.name)
    private readonly AdvertiserModel: Model<Advertiser>,
    @InjectModel(Event.name)
    private readonly EventModel: Model<Event>,
    @InjectModel(Ownership.name)
    private readonly ownershipModel: Model<Ownership>
  ) { }

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
            _id: 0,
            startDate: 1,
            startTime: 1,
            endTime: 1,
            endDate: 1,
            eventName :1,
            duration: 1,
            eventStatus: 1,
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
  async getAdvertisers(name: string, eventId: string, loginResponse: any) {
    try {
      // Check if the user is an organizer
      await this.getEventDetails(eventId, loginResponse, true)
      // Set up the aggregation pipeline for fetching advertisers
      const pipeline = [];
      let search = {};
      let match_isDeleted = {};
      let lookup = {};
      let project = {};
      let match = {};
      if (name) {
        // Autocomplete search by Advertiser orgName
        search = {
          $search: {
            index: INDEX_NAME.ADVERTISER_SEARCH_INDEX,
            autocomplete: {
              query: name,
              path: "orgName",
            },
          },
        };
        pipeline.push(search);
      }
      // Match for isDeleted field
      match_isDeleted = {
        $match: { isDeleted: false },
      };
      // Lookup ownerships to check if advertiser is already associated with the event
      lookup = {
        $lookup: {
          from: "ownerships",
          localField: "_id",
          foreignField: "ownerId",
          pipeline: [
            { $match: { event: new ObjectId(eventId), isDeleted: false } },
            { $project: { ownerId: 1, isDeleted: 1 } },
          ],
          as: "advertiser",
        },
      };
      // Match to filter advertisers not associated with the event
      match = {
        $match: { advertiser: { $eq: [] } },
      };
      // Project only required fields
      project = {
        $project: { orgName: 1, isDeleted: 1, isKYCVerified: 1 },
      };
      pipeline.push(match_isDeleted);
      pipeline.push(lookup);
      pipeline.push(match);
      pipeline.push(project);
      const advertiserData = await this.AdvertiserModel.aggregate(pipeline);
      return advertiserData;
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ADVERTISER_ERROR_LOG, error);
      this.errorService.error({ message: error }, 400);
    }
  }

  async updateAdvertiser(
    advertiserId: string,
    eventId: string,
    loginResponse: any,
    userTimeZone
  ) {
    try {
      // Check if the event exists and is associated with the organizer
      const isEventExist = await this.getEventDetails(eventId, loginResponse, true)
      // Check if the advertiser exists
      const advertiser = await this.AdvertiserModel.findOne({
        _id: new ObjectId(advertiserId),
        isDeleted: false,
      });
      if (!advertiser) {
        // Advertiser does not exist
        return this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_ADVERTSIER_ID },
          404
        );
      }
      // Parse and store relevant information from the event to update the ownership collection for timeslots.
      const startDate = new Date(isEventExist.startDate);
      const endDate = new Date(isEventExist.endDate);
      const startTime = isEventExist.startTime.split(":").map(Number);
      const EventstartDate = new Date(
        startDate.setUTCHours(startTime[0], startTime[1], 0, 0)
      );
      const EventendDate = new Date(
        endDate.setUTCHours(
          startTime[0] + isEventExist.duration,
          startTime[1],
          0,
          0
        )
      );
      // Prepare data for ownership creation
      let ownership_data = {
        ownerId: new ObjectId(advertiserId),
        event: new ObjectId(eventId),
        name: advertiser.orgName,
        type: ROLES.EVENT_ADVERTISER,
        eventName: isEventExist.eventName,
        assets: [],
        ownerAssets: [],
        timeSlot: [{ startTime: EventstartDate, endTime: EventendDate }],
      };
      let owner: any = await this.ownershipEngine.addOwnership(
        ownership_data,
        userTimeZone
      );
      // Check if advertiser ID already exists
      if (!!owner?.updatedAt) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.ADVERTISER_ID_ALREADY_EXISTS },
          409
        );
      }
      // Update event progress
      await this.EventModel.findByIdAndUpdate(
        eventId,
        {
          $addToSet: { progress: { $each: [PROGRESS_ORGANIZER.ADVERTISER] } },
        },
        { new: true }
      );
      // Remove progress related to banner assignment
      await this.EventModel.findByIdAndUpdate(
        eventId,
        {
          $pull: { progress: PROGRESS_ORGANIZER.ASSIGNBANNER },
        },
        { new: true }
      );
      return {
        isOk: true,
        message: SUCCESS_MESSAGE.ADDED_ADVERTISER,
      };
    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.ERROR_ADDING_ADVERTISER, error);
      return error;
    }
  }

  async deleteAdvertiser(
    advertiserId: string,
    eventId: string,
    loginResponse: any,
    userTimeZone
  ) {
    try {
      // Check if the event exists and is associated with the organizer
      await this.getEventDetails(eventId, loginResponse, true)
      // Prepare data for ownership deletion
      let ownership_data = {
        event: new ObjectId(eventId),
        ownerId: new ObjectId(advertiserId),
      };
      let owner = await this.ownershipEngine.deleteOwnership(
        ownership_data,
        userTimeZone
      );
      await this.eventService.updateProgress(eventId);
      // Check if advertiser was already deleted
      if (owner === null) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.ADVERTISER_ALREAY_DELETED },
          404
        );
      }
      // Count the remaining advertisers for the event
      let [advertiser_count] = await this.ownershipModel.aggregate([
        {
          $match: {
            event: new ObjectId(eventId),
            type: ROLES.EVENT_ADVERTISER,
            isDeleted: false,
          },
        },
        {
          $count: "count",
        },
      ]);
      // If no advertisers are remaining, update event progress
      if (!advertiser_count?.count) {
        await this.EventModel.findByIdAndUpdate(
          eventId,
          {
            $pull: { progress: PROGRESS_ORGANIZER.ADVERTISER },
          },
          { new: true }
        );
      }
      // Return success message
      return {
        isOk: true,
        message: SUCCESS_MESSAGE.DELETED_ADVERTISER,
      };
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.DELETING_ADVERTISER_LOG, error);
      return error;
    }
  }

  async getAdvertisersbyeventId(
    eventId: string,
    paginationInput: PaginationInput,
    loginResponse: any
  ) {
    try {
      // Check if the event exists and is not in DRAFT or NEW status
      await this.getEventDetails(eventId, loginResponse, true)
      // Set default values for pagination if not provided
      paginationInput.skip =
        paginationInput.skip >= 0 ? paginationInput.skip : 0;
      paginationInput.limit =
        paginationInput.limit > 0 ? paginationInput.limit : 3;
      // Retrieve advertisers for the specified event
      let advertiser = await this.ownershipModel.aggregate([
        {
          $match: {
            event: new ObjectId(eventId),
            type: ROLES.EVENT_ADVERTISER,
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "advertisers",
            localField: "ownerId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true, // Preserve null and empty arrays
          },
        },
        {
          $project: {
            event: 1,
            orgName: "$name",
            isKYCVerified: "$user.isKYCVerified",
            userId: "$user.userId",
          },
        },
        {
          $facet: {
            result: [
              { $skip: paginationInput.skip * paginationInput.limit },
              { $limit: paginationInput.limit },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
      ]);
      // Return the result with data, total count, and filtered count
      return {
        data: advertiser[0]?.result ? advertiser[0]?.result : [],
        total: advertiser[0]?.totalCount[0]?.count
          ? advertiser[0]?.totalCount[0]?.count
          : 0,
        filtered: advertiser[0]?.result.length
          ? advertiser[0]?.result.length
          : 0,
      };
    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.ERROR_ADVERTISER, error);
      return this.errorService.error({ message: error }, 400);
    }
  }
}
