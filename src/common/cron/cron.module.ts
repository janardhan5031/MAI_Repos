import { Module } from "@nestjs/common";
import { ConfigurationModule } from "../../common/config/config.module";
import { LoggingModule } from "../../common/logging/logging.module";
import { MongooseModule } from "@nestjs/mongoose";
import {
  Event,
  EventSchema,
} from "../../common/database/entities/events.entity";
import { ErrorService } from "../../common/services/errorService";
import { CronService } from "./cron.service";
import { LoggingService } from "../../common/logging/logging.service";
import { Vendor, VendorSchema } from "../database/entities/vendor.entity";
import { NotificationEngine } from "../services/notification_engine";
import {
  Organizer,
  OrganizerSchema,
} from "../database/entities/organizer.entity";
import {
  Ownership,
  ownershipSchema,
} from "../database/entities/meta/ownership.entity";
import { Banner, BannerSchema } from "../database/entities/banner.entity";
import { Props, PropsSchema } from "../database/entities/meta.entities";
import { Venue, VenueSchema } from "../database/entities/meta/venue.entity";
import { Kiosk, KioskSchema } from "../database/entities/kiosk.entity";
import {
  VendorEvent,
  VendorEventSchema,
} from "../database/entities/vendorEvent.entity";
import { Artist, ArtistSchema } from "../database/entities/artist.entity";
import { KafkaService } from "../kafka/kafka.service";
import { NotificationEngineService } from "../services/notificatioService";
import { Gallery, GallerySchema } from "../database/entities/gallery.entity";
import { Analytics, AnalyticsSchema } from "../database/entities/analytics.entity";
import { RedisHelperService } from "../redis-helpers/redis-helper.service";
import { EventService } from "src/modules/event/events.service";
import { AuthEngine } from "../services/auth_engine";
import { AttendeesService } from "../services/attendeesService";
import { TimeConversionHelperService } from "../helper/timezone";
import { OnwershipService } from "../services/ownershipService";
import { LanguageService } from "src/modules/languages/languages.service";
import { Languages, LanguageSchema } from "../database/entities/languages";
import { EventCategory, EventCategorySchema } from "../database/entities/eventCategories";
import { Ticket, TicketSchema } from "../database/entities/ticket.entity";
import { Slot, SlotSchema } from "../database/entities/slots.entity";
import { Advertiser, AdvertiserSchema } from "../database/entities/advertiser.entity";
import { EventDebatePolls, EventDebatePollsModelSchema } from "../database/entities/debatepolls.entity";

@Module({
  imports: [
    LoggingModule,
    ConfigurationModule,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: EventDebatePolls.name, schema: EventDebatePollsModelSchema},
      { name: Vendor.name, schema: VendorSchema },
      { name: Organizer.name, schema: OrganizerSchema },
      { name: Ownership.name, schema: ownershipSchema },
      { name: Banner.name, schema: BannerSchema },
      { name: Props.name, schema: PropsSchema },
      { name: Venue.name, schema: VenueSchema },
      { name: Artist.name, schema: ArtistSchema },
      { name: Kiosk.name, schema: KioskSchema },
      { name: VendorEvent.name, schema: VendorEventSchema },
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: Gallery.name, schema: GallerySchema },
      { name: Languages.name, schema: LanguageSchema },
      { name: EventCategory.name, schema: EventCategorySchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: Slot.name, schema: SlotSchema },
      { name: Advertiser.name, schema: AdvertiserSchema },
    ]),
  ],
  providers: [
    NotificationEngineService,
    LoggingService,
    KafkaService,
    NotificationEngine,
    RedisHelperService,
    CronService,
    ErrorService,
    EventService,
    AuthEngine,
    AttendeesService,
    TimeConversionHelperService,
    OnwershipService,
    LanguageService
  ],
  exports: [CronService, EventService],
})
export class CronModule { }
