import { VendorService } from "./vendor.service";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigurationModule } from "src/common/config/config.module";
import { LoggingModule } from "src/common/logging/logging.module";
import { Kiosk, KioskSchema } from "src/common/database/entities/kiosk.entity";
import { VendorResolver } from "./vendor.resolver";
import { EventSchema } from "src/common/database/entities/events.entity";
import { ErrorService } from "src/common/services/errorService";
import {
  Vendor,
  VendorSchema,
} from "src/common/database/entities/vendor.entity";
import { AuthEngine } from "src/common/services/auth_engine";
import {
  VendorEvent,
  VendorEventSchema,
} from "src/common/database/entities/vendorEvent.entity";
import {
  Ownership,
  ownershipSchema,
} from "src/common/database/entities/meta/ownership.entity";
import {
  Venue,
  VenueSchema,
} from "src/common/database/entities/meta/venue.entity";
import {
  MetaKiosk,
  MetaKioskSchema,
} from "src/common/database/entities/meta/metakiosk.entity";
import { OnwershipService } from "src/common/services/ownershipService";
import { TimeConversionHelperService } from "src/common/helper/timezone";
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
  Artist,
  ArtistSchema,
} from "src/common/database/entities/artist.entity";
import { KafkaService } from "src/common/kafka/kafka.service";
import { NotificationEngineService } from "src/common/services/notificatioService";
import { Gallery, GallerySchema } from "src/common/database/entities/gallery.entity";
import { EventModule } from "../event/events.module";
import { Analytics, AnalyticsSchema } from "src/common/database/entities/analytics.entity";
import { EventDebatePolls, EventDebatePollsModelSchema } from "src/common/database/entities/debatepolls.entity";

@Module({
  imports: [
    LoggingModule,
    ConfigurationModule,
    MongooseModule.forFeature([
      { name: Kiosk.name, schema: KioskSchema },
      { name: MetaKiosk.name, schema: MetaKioskSchema },
      { name: Event.name, schema: EventSchema },
      { name: EventDebatePolls.name, schema: EventDebatePollsModelSchema},
      { name: Analytics.name, schema: AnalyticsSchema},
      { name: Venue.name, schema: VenueSchema },
      { name: VendorEvent.name, schema: VendorEventSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Artist.name, schema: ArtistSchema },
      { name: Ownership.name, schema: ownershipSchema },
      { name: Organizer.name, schema: OrganizerSchema },
      { name: Banner.name, schema: BannerSchema },
      { name: Props.name, schema: PropsSchema },
      { name: Gallery.name, schema: GallerySchema },
    ]),
  ],
  providers: [
    VendorResolver,
    VendorService,
    TimeConversionHelperService,
    NotificationEngineService,
    OnwershipService,
    AuthEngine,
    ErrorService,
    KafkaService,
    NotificationEngine,
  ],
  exports: [VendorService],
})
export class VendorModule {}
