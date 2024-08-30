import { Module } from "@nestjs/common";
import { ConfigurationModule } from "src/common/config/config.module";
import { LoggingModule } from "src/common/logging/logging.module";
import { MongooseModule } from "@nestjs/mongoose";
import { RedisHelperService } from "src/common/redis-helpers/redis-helper.service";
import {
  Artist,
  ArtistSchema,
} from "../../common/database/entities/artist.entity";
import { ArtistResolver } from "./artist.resolver";
import { ArtistService } from "./artist.service";
import { Slot, SlotSchema } from "src/common/database/entities/slots.entity";
import { ErrorService } from "src/common/services/errorService";
import { AuthEngine } from "src/common/services/auth_engine";
import { KafkaService } from "src/common/kafka/kafka.service";
import { ConfigService } from "src/common/config/config.service";
import { Event, EventSchema } from "src/common/database/entities/events.entity";
import {
  Advertiser,
  AdvertiserSchema,
} from "src/common/database/entities/advertiser.entity";
import {
  Vendor,
  VendorSchema,
} from "src/common/database/entities/vendor.entity";
import {
  Ownership,
  ownershipSchema,
} from "src/common/database/entities/meta/ownership.entity";
import {
  Organizer,
  OrganizerSchema,
} from "src/common/database/entities/organizer.entity";
import { NotificationEngine } from "src/common/services/notification_engine";
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
import {
  Analytics,
  AnalyticsSchema,
} from "src/common/database/entities/analytics.entity";
import {
  Gallery,
  GallerySchema,
} from "src/common/database/entities/gallery.entity";
import { VenueService } from "../venue/venue.service";
import { TimeConversionHelperService } from "src/common/helper/timezone";
import { PaymentEngine } from "src/common/services/paymentService";
import { EventCategory, EventCategorySchema } from "src/common/database/entities/eventCategories";
import { EventDebatePolls, EventDebatePollsModelSchema } from "src/common/database/entities/debatepolls.entity";

@Module({
  imports: [
    ConfigurationModule,
    LoggingModule,
    MongooseModule.forFeature([
      { name: Artist.name, schema: ArtistSchema },
      { name: Slot.name, schema: SlotSchema },
      { name: Event.name, schema: EventSchema },
      { name: EventDebatePolls.name, schema: EventDebatePollsModelSchema},
      { name: Ownership.name, schema: ownershipSchema },
      { name: Advertiser.name, schema: AdvertiserSchema },
      { name: Organizer.name, schema: OrganizerSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Banner.name, schema: BannerSchema },
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: Venue.name, schema: VenueSchema },
      { name: Props.name, schema: PropsSchema },
      { name: Kiosk.name, schema: KioskSchema },
      { name: VendorEvent.name, schema: VendorEventSchema },
      { name: Gallery.name, schema: GallerySchema },
      { name: EventCategory.name, schema: EventCategorySchema },
    ]),
  ],
  providers: [
    RedisHelperService,
    AuthEngine,
    VenueService,
    PaymentEngine,
    ArtistResolver,
    ArtistService,
    TimeConversionHelperService,
    NotificationEngineService,
    AuthEngine,
    NotificationEngine,
    ErrorService,
    KafkaService,
    ConfigService,
  ],
  exports: [ArtistService],
})
export class ArtistModule {}
