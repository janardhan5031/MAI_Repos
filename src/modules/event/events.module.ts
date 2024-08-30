import { Module } from "@nestjs/common";
import { ConfigurationModule } from "src/common/config/config.module";
import { LoggingModule } from "src/common/logging/logging.module";
import { MongooseModule } from "@nestjs/mongoose";
import {
  Event,
  EventSchema,
} from "../../common/database/entities/events.entity";
import { EventResolver } from "./events.resolver";
import { EventService } from "./events.service";
import {
  Ticket,
  TicketSchema,
} from "src/common/database/entities/ticket.entity";
import { InputManipulationService } from "src/common/shared/input_manipulation";
import { LoggingService } from "src/common/logging/logging.service";
import { ErrorService } from "src/common/services/errorService";
import {
  EventCategory,
  EventCategorySchema,
} from "src/common/database/entities/eventCategories";
import {
  LanguageSchema,
  Languages,
} from "src/common/database/entities/languages";
import { NotificationEngine } from "src/common/services/notification_engine";
import { AdvertiserService } from "../advertiser/advertiser.service";
import {
  Advertiser,
  AdvertiserSchema,
} from "src/common/database/entities/advertiser.entity";
import { Slot, SlotSchema } from "src/common/database/entities/slots.entity";
import { KafkaService } from "src/common/kafka/kafka.service";
import { ConfigService } from "@nestjs/config";
import {
  Vendor,
  VendorSchema,
} from "src/common/database/entities/vendor.entity";
import { Venue } from "src/common/database/entities/meta/venue.entity";
import { VenueSchema } from "src/common/database/entities/meta/venue.entity";
import { TimeConversionHelperService } from "src/common/helper/timezone";
import {
  Ownership,
  ownershipSchema,
} from "src/common/database/entities/meta/ownership.entity";
import { ArtistService } from "../artist/artist.service";
import { AuthEngine } from "src/common/services/auth_engine";
import { ArtistModule } from "../artist/artist.module";
import {
  Artist,
  ArtistSchema,
} from "src/common/database/entities/artist.entity";
import {
  Organizer,
  OrganizerSchema,
} from "src/common/database/entities/organizer.entity";
import { OnwershipService } from "src/common/services/ownershipService";
import {
  Banner,
  BannerSchema,
} from "src/common/database/entities/banner.entity";
import { Props, PropsSchema } from "src/common/database/entities/meta.entities";
import { Kiosk, KioskSchema } from "src/common/database/entities/kiosk.entity";
import {
  VendorEvent,
  VendorEventSchema,
} from "src/common/database/entities/vendorEvent.entity";
import { NotificationEngineService } from "src/common/services/notificatioService";
import { Gallery, GallerySchema } from "src/common/database/entities/gallery.entity";
import { Analytics, AnalyticsSchema } from "src/common/database/entities/analytics.entity";
import { VenueService } from "../venue/venue.service";
import { RedisHelperService } from "src/common/redis-helpers/redis-helper.service";
import { PaymentEngine } from "src/common/services/paymentService";
import { AttendeesService } from "src/common/services/attendeesService";
import { EventDebatePolls, EventDebatePollsModelSchema } from "src/common/database/entities/debatepolls.entity";

@Module({
  imports: [
    ConfigurationModule,
    LoggingModule,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: EventDebatePolls.name, schema: EventDebatePollsModelSchema},
      { name: Ticket.name, schema: TicketSchema },
      { name: Languages.name, schema: LanguageSchema },
      { name: EventCategory.name, schema: EventCategorySchema },
      { name: Venue.name, schema: VenueSchema },
      { name: Advertiser.name, schema: AdvertiserSchema },
      { name: Slot.name, schema: SlotSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: Ownership.name, schema: ownershipSchema },
      { name: Artist.name, schema: ArtistSchema },
      { name: Organizer.name, schema: OrganizerSchema },
      { name: Banner.name, schema: BannerSchema },
      { name: Props.name, schema: PropsSchema },
      { name: Kiosk.name, schema: KioskSchema },
      { name: VendorEvent.name, schema: VendorEventSchema },
      { name: Gallery.name, schema: GallerySchema },
    ]),
  ],
  providers: [
    EventService,
    VenueService,
    RedisHelperService,
    EventResolver,
    InputManipulationService,
    AdvertiserService,
    PaymentEngine,
    OnwershipService,
    ArtistService,
    LoggingService,
    NotificationEngineService,
    ArtistModule,
    TimeConversionHelperService,
    ErrorService,
    NotificationEngine,
    KafkaService,
    ConfigService,
    AuthEngine,
    AttendeesService,
  ],
  exports: [EventService, AdvertiserService, AuthEngine],
})
export class EventModule { }
