import { Module } from "@nestjs/common";
import { ConfigurationModule } from "src/common/config/config.module";
import { LoggingModule } from "src/common/logging/logging.module";
import { MongooseModule } from "@nestjs/mongoose";
import { RedisHelperService } from "src/common/redis-helpers/redis-helper.service";
import {
  Artist,
  ArtistSchema,
} from "../../common/database/entities/artist.entity";

import { ErrorService } from "src/common/services/errorService";
import { AdvertiserService } from "./advertiser.service";
import { AdvertiserResolver } from "./advertiser.resolver";
import {
  Advertiser,
  AdvertiserSchema,
} from "src/common/database/entities/advertiser.entity";
import { Event, EventSchema } from "src/common/database/entities/events.entity";
import { LoggingService } from "src/common/logging/logging.service";
import {
  Ownership,
  ownershipSchema,
} from "src/common/database/entities/meta/ownership.entity";
import { OnwershipService } from "src/common/services/ownershipService";
import { TimeConversionHelperService } from "src/common/helper/timezone";
import { KafkaService } from "src/common/kafka/kafka.service";
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
import { Kiosk, KioskSchema } from "src/common/database/entities/kiosk.entity";
import {
  VendorEvent,
  VendorEventSchema,
} from "src/common/database/entities/vendorEvent.entity";
import { NotificationEngineService } from "src/common/services/notificatioService";
import { Gallery, GallerySchema } from "src/common/database/entities/gallery.entity";
import { EventModule } from "../event/events.module";
import { Analytics, AnalyticsSchema } from "src/common/database/entities/analytics.entity";
import { EventDebatePolls, EventDebatePollsModelSchema } from "src/common/database/entities/debatepolls.entity";
@Module({
  imports: [
    ConfigurationModule,
    LoggingModule,
    EventModule,
    MongooseModule.forFeature([
      { name: Advertiser.name, schema: AdvertiserSchema },
      { name: Event.name, schema: EventSchema },
      { name: EventDebatePolls.name, schema: EventDebatePollsModelSchema},
      { name: Ownership.name, schema: ownershipSchema },
      { name: Organizer.name, schema: OrganizerSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: Banner.name, schema: BannerSchema },
      { name: Venue.name, schema: VenueSchema },
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: Props.name, schema: PropsSchema },
      { name: Kiosk.name, schema: KioskSchema },
      { name: Artist.name, schema: ArtistSchema },
      { name: VendorEvent.name, schema: VendorEventSchema },
      { name: Gallery.name, schema: GallerySchema },
    ]),
  ],
  providers: [
    RedisHelperService,
    NotificationEngine,
    NotificationEngineService,
    OnwershipService,
    TimeConversionHelperService,
    KafkaService,
    AdvertiserService,
    AdvertiserResolver,
    LoggingService,
    ErrorService,
  ],
  exports: [AdvertiserService],
})
export class AdvertiserModule {}
