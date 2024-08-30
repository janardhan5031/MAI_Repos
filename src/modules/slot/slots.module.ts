import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigurationModule } from "src/common/config/config.module";
import { LoggingModule } from "src/common/logging/logging.module";
import {
  Artist,
  ArtistSchema,
} from "../../common/database/entities/artist.entity";
import { Slot, SlotSchema } from "../../common/database/entities/slots.entity";
import { SlotService } from "./slots.service";
import { SlotResolver } from "./slots.resolver";
import { EventSchema } from "src/common/database/entities/events.entity";
import { InputManipulationService } from "src/common/shared/input_manipulation";
import { ErrorService } from "src/common/services/errorService";
import { LoggingService } from "src/common/logging/logging.service";
import { TimeConversionHelperService } from "src/common/helper/timezone";
import {
  Ownership,
  ownershipSchema,
} from "src/common/database/entities/meta/ownership.entity";
import {
  Vendor,
  VendorSchema,
} from "src/common/database/entities/vendor.entity";
import { KafkaService } from "src/common/kafka/kafka.service";
import { ConfigService } from "src/common/config/config.service";
import { OnwershipService } from "src/common/services/ownershipService";
import { NotificationEngine } from "src/common/services/notification_engine";
import {
  Organizer,
  OrganizerSchema,
} from "src/common/database/entities/organizer.entity";
import {
  Banner,
  BannerSchema,
} from "src/common/database/entities/banner.entity";
import { Props, PropsSchema } from "src/common/database/entities/meta.entities";
import {
  Venue,
  VenueSchema,
} from "src/common/database/entities/meta/venue.entity";
import { Kiosk, KioskSchema } from "src/common/database/entities/kiosk.entity";
import {
  VendorEvent,
  VendorEventSchema,
} from "src/common/database/entities/vendorEvent.entity";
import { NotificationEngineService } from "src/common/services/notificatioService";
import { Gallery, GallerySchema } from "src/common/database/entities/gallery.entity";
import { EventService } from "../event/events.service";
import { AuthEngine } from "src/common/services/auth_engine";
import { LanguageModule } from "../languages/languages.module";
import { EventModule } from "../event/events.module";
import { Analytics, AnalyticsSchema } from "src/common/database/entities/analytics.entity";
import { EventDebatePolls, EventDebatePollsModelSchema } from "src/common/database/entities/debatepolls.entity";

@Module({
  imports: [
    ConfigurationModule,
    LoggingModule,
    EventModule,
    MongooseModule.forFeature([
      { name: Artist.name, schema: ArtistSchema },
      { name: Event.name, schema: EventSchema },
      { name: EventDebatePolls.name, schema: EventDebatePollsModelSchema},
      { name: Slot.name, schema: SlotSchema },
      { name: Ownership.name, schema: ownershipSchema },
      { name: Organizer.name, schema: OrganizerSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Banner.name, schema: BannerSchema },
      { name: Venue.name, schema: VenueSchema },
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: Props.name, schema: PropsSchema },
      { name: Kiosk.name, schema: KioskSchema },
      { name: VendorEvent.name, schema: VendorEventSchema },
      { name: Gallery.name, schema: GallerySchema },
    ]),
  ],
  providers: [
    SlotResolver,
    SlotService,
    OnwershipService,
    LanguageModule,
    InputManipulationService,
    TimeConversionHelperService,
    ErrorService,
    LoggingService,
    NotificationEngineService,
    KafkaService,
    ConfigService,
    NotificationEngine,
  ],
  exports: [SlotService],
})
export class SlotModule {}
