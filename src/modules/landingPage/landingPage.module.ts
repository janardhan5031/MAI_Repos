import { Module } from "@nestjs/common";
import { ConfigurationModule } from "src/common/config/config.module";
import { LoggingModule } from "src/common/logging/logging.module";
import { MongooseModule } from "@nestjs/mongoose";
import {
  Event,
  EventSchema,
} from "../../common/database/entities/events.entity";
import { LandingPageService } from "./landingPage.service";
import { ErrorService } from "src/common/services/errorService";
import { RedisHelperService } from "src/common/redis-helpers/redis-helper.service";
import { LandingPageResolver } from "./landingPage.reslover";
import { Organizer, OrganizerSchema } from "src/common/database/entities/organizer.entity";

@Module({
  imports: [
    ConfigurationModule,
    LoggingModule,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Organizer.name, schema: OrganizerSchema },
    ]),
  ],
  providers: [
    LandingPageService,
    ErrorService,
    LandingPageResolver,
    RedisHelperService,
  ],
  exports: [LandingPageService],
})
export class LandingPageModule { }
