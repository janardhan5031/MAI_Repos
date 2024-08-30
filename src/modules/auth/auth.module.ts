import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigurationModule } from "src/common/config/config.module";
import { LoggingModule } from "src/common/logging/logging.module";
import {
  Organizer,
  OrganizerSchema,
} from "../../common/database/entities/organizer.entity";
import {
  Artist,
  ArtistSchema,
} from "../../common/database/entities/artist.entity";
import { RedisHelperService } from "src/common/redis-helpers/redis-helper.service";
import { AuthResolver } from "./auth.resolver";
import { AuthService } from "./auth.service";
import { AuthEngine } from "src/common/services/auth_engine";
import { ErrorService } from "src/common/services/errorService";
import { AdvertiserService } from "../advertiser/advertiser.service";
import {
  Advertiser,
  AdvertiserSchema,
} from "src/common/database/entities/advertiser.entity";
import { EventSchema } from "src/common/database/entities/events.entity";
import { ArtistService } from "../artist/artist.service";
import { SlotService } from "../slot/slots.service";
import { Slot, SlotSchema } from "src/common/database/entities/slots.entity";
import { InputManipulationService } from "src/common/shared/input_manipulation";
import {
  Banner,
  BannerSchema,
} from "src/common/database/entities/banner.entity";
import { Props, PropsSchema } from "src/common/database/entities/meta.entities";
import { Kiosk, KioskSchema } from "src/common/database/entities/kiosk.entity";
import {
  Ownership,
  ownershipSchema,
} from "src/common/database/entities/meta/ownership.entity";
import {
  Venue,
  VenueSchema,
} from "src/common/database/entities/meta/venue.entity";
import { TimeConversionHelperService } from "src/common/helper/timezone";
import {
  Vendor,
  VendorSchema,
} from "src/common/database/entities/vendor.entity";
import { KafkaService } from "src/common/kafka/kafka.service";
import { OnwershipService } from "src/common/services/ownershipService";
import { NotificationEngine } from "src/common/services/notification_engine";
import {
  VendorEvent,
  VendorEventSchema,
} from "src/common/database/entities/vendorEvent.entity";
import { NotificationEngineService } from "src/common/services/notificatioService";
import {
  Gallery,
  GallerySchema,
} from "src/common/database/entities/gallery.entity";
import { EventModule } from "../event/events.module";
import { SlotModule } from "../slot/slots.module";
import {
  Analytics,
  AnalyticsSchema,
} from "src/common/database/entities/analytics.entity";
import { VenueService } from "../venue/venue.service";
import { PaymentEngine } from "src/common/services/paymentService";
import { EventCategory, EventCategorySchema } from "src/common/database/entities/eventCategories";
import { EventDebatePolls, EventDebatePollsModelSchema } from "src/common/database/entities/debatepolls.entity";

@Module({
  imports: [
    ConfigurationModule,
    LoggingModule,
    MongooseModule.forFeature([
      { name: Organizer.name, schema: OrganizerSchema },
      { name: Artist.name, schema: ArtistSchema },
      { name: Advertiser.name, schema: AdvertiserSchema },
      { name: Event.name, schema: EventSchema },
      { name: EventDebatePolls.name, schema: EventDebatePollsModelSchema},
      { name: Slot.name, schema: SlotSchema },
      { name: Venue.name, schema: VenueSchema },
      { name: Banner.name, schema: BannerSchema },
      { name: Props.name, schema: PropsSchema },
      { name: Kiosk.name, schema: KioskSchema },
      { name: Ownership.name, schema: ownershipSchema },
      { name: Event.name, schema: EventSchema },
      { name: Slot.name, schema: SlotSchema },
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Advertiser.name, schema: AdvertiserSchema },
      { name: VendorEvent.name, schema: VendorEventSchema },
      { name: Gallery.name, schema: GallerySchema },
      { name: EventCategory.name, schema: EventCategorySchema },
    ]),
    EventModule,
  ],
  providers: [
    RedisHelperService,
    AuthResolver,
    PaymentEngine,
    InputManipulationService,
    NotificationEngineService,
    AuthService,
    VenueService,
    ArtistService,
    NotificationEngine,
    TimeConversionHelperService,
    SlotService,
    AdvertiserService,
    ErrorService,
    OnwershipService,
    KafkaService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
