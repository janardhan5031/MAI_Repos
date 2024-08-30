import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigurationModule } from "src/common/config/config.module";
import { Event, EventSchema } from "src/common/database/entities/events.entity";
import { LoggingModule } from "src/common/logging/logging.module";
import { LoggingService } from "src/common/logging/logging.service";
import { ErrorService } from "src/common/services/errorService";
import { VenueResolver } from "./venue.resolver";
import { VenueService } from "./venue.service";
import { RedisHelperService } from "src/common/redis-helpers/redis-helper.service";
import {
  BannerSchema,
  Banner,
} from "src/common/database/entities/banner.entity";
import {
  Vendor,
  VendorSchema,
} from "src/common/database/entities/vendor.entity";
import {
  Venue,
  VenueSchema,
} from "src/common/database/entities/meta/venue.entity";
import {
  Ownership,
  ownershipSchema,
} from "src/common/database/entities/meta/ownership.entity";
import { TimeConversionHelperService } from "src/common/helper/timezone";
import {
  Organizer,
  OrganizerSchema,
} from "src/common/database/entities/organizer.entity";
import { NotificationEngine } from "src/common/services/notification_engine";
import { Props, PropsSchema } from "src/common/database/entities/meta.entities";
import { Kiosk, KioskSchema } from "src/common/database/entities/kiosk.entity";
import {
  VendorEvent,
  VendorEventSchema,
} from "src/common/database/entities/vendorEvent.entity";
import {
  Artist,
  ArtistSchema,
} from "src/common/database/entities/artist.entity";
import { KafkaService } from "src/common/kafka/kafka.service";
import { NotificationEngineService } from "src/common/services/notificatioService";
import { PaymentEngine } from "src/common/services/paymentService";
import { Gallery, GallerySchema } from "src/common/database/entities/gallery.entity";
import { Analytics, AnalyticsSchema } from "src/common/database/entities/analytics.entity";
import { EventCategory, EventCategorySchema } from "src/common/database/entities/eventCategories";
import { EventDebatePolls, EventDebatePollsModelSchema } from "src/common/database/entities/debatepolls.entity";

@Module({
  imports: [
    ConfigurationModule,
    LoggingModule,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: EventDebatePolls.name, schema: EventDebatePollsModelSchema},
      { name: Venue.name, schema: VenueSchema },
      { name: Banner.name, schema: BannerSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: Organizer.name, schema: OrganizerSchema },
      { name: Ownership.name, schema: ownershipSchema },
      { name: Props.name, schema: PropsSchema },
      { name: Kiosk.name, schema: KioskSchema },
      { name: Artist.name, schema: ArtistSchema },
      { name: VendorEvent.name, schema: VendorEventSchema },
      { name: Gallery.name, schema: GallerySchema },
      { name: EventCategory.name, schema: EventCategorySchema },
    ]),
  ],
  providers: [
    LoggingService,
    NotificationEngineService,
    ErrorService,
    PaymentEngine,
    VenueResolver,
    NotificationEngine,
    VenueService,
    RedisHelperService,
    TimeConversionHelperService,
    KafkaService,
  ],
  exports: [VenueService],
})
export class VenueModule {}
