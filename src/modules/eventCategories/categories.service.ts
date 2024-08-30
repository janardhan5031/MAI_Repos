import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ERROR_MESSAGES } from "src/common/config/constants";
import { EventCategory } from "src/common/database/entities/eventCategories";
import { LoggingService } from "src/common/logging/logging.service";

@Injectable()
export class EventCategoryService {
  constructor(
    private readonly loggingService: LoggingService,
    @InjectModel(EventCategory.name)
    private readonly eventCategoryModel: Model<EventCategory>
  ) {}

  async getEventCategories(loginResponse: any) {
    try {
      if (!loginResponse.isOrganizer) {
        return new Error(
          ERROR_MESSAGES.NOT_AUTHORIZED_EVENT_CATEGORIES
        );
      }

      const eventCategories = await this.eventCategoryModel.aggregate([
        { $match: { isDeleted: false } },
      ]);
      return eventCategories;
    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.ERROR_ADDING_EVENT_CATEGORY, error);
      return error;
    }
  }
}
