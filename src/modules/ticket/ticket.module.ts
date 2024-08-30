import { Module } from "@nestjs/common";
import { ConfigurationModule } from "src/common/config/config.module";
import { LoggingModule } from "src/common/logging/logging.module";
import { MongooseModule } from "@nestjs/mongoose";
import { RedisHelperService } from "src/common/redis-helpers/redis-helper.service";
import {
  Ticket,
  TicketSchema,
} from "../../common/database/entities/ticket.entity";
import { TicketResolver } from "./ticket.resolver";
import { TicketService } from "./ticket.service";
import { Event, EventSchema } from "src/common/database/entities/events.entity";
import { ErrorService } from "src/common/services/errorService";
import { TimeConversionHelperService } from "src/common/helper/timezone";
import {
  Vendor,
  VendorSchema,
} from "src/common/database/entities/vendor.entity";
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
import {
  Ownership,
  ownershipSchema,
} from "src/common/database/entities/meta/ownership.entity";
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
import { Gallery, GallerySchema } from "src/common/database/entities/gallery.entity";
import { Analytics, AnalyticsSchema } from "src/common/database/entities/analytics.entity";
import { EventDebatePolls, EventDebatePollsModelSchema } from "src/common/database/entities/debatepolls.entity";

@Module({
  imports: [
    ConfigurationModule,
    LoggingModule,
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: Event.name, schema: EventSchema },
      { name: EventDebatePolls.name, schema: EventDebatePollsModelSchema},
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Organizer.name, schema: OrganizerSchema },
      { name: Banner.name, schema: BannerSchema },
      { name: Props.name, schema: PropsSchema },
      { name: Venue.name, schema: VenueSchema },
      { name: Artist.name, schema: ArtistSchema },
      { name: Ownership.name, schema: ownershipSchema },
      { name: Kiosk.name, schema: KioskSchema },
      { name: VendorEvent.name, schema: VendorEventSchema },
      { name: Gallery.name, schema: GallerySchema },
    ]),
  ],
  providers: [
    RedisHelperService,
    ErrorService,
    NotificationEngine,
    TimeConversionHelperService,
    TicketResolver,
    TicketService,
    NotificationEngineService,
    KafkaService,
  ],
  exports: [TicketService],
})
export class TicketModule {}
