import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  EventCategory,
  EventCategorySchema,
} from "src/common/database/entities/eventCategories";
import { LoggingModule } from "src/common/logging/logging.module";
import { EventCategoryResolver } from "./categories.resolver";
import { EventCategoryService } from "./categories.service";

@Module({
  imports: [
    LoggingModule,
    MongooseModule.forFeature([
      { name: EventCategory.name, schema: EventCategorySchema },
    ]),
  ],
  providers: [EventCategoryResolver, EventCategoryService],
  exports: [EventCategoryService],
})
export class EventCategoriesModule {}
