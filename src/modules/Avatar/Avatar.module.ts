import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigurationModule } from "src/common/config/config.module";
import {
  Artist,
  ArtistSchema,
} from "src/common/database/entities/artist.entity";
import { LoggingModule } from "src/common/logging/logging.module";
import { RedisHelperService } from "src/common/redis-helpers/redis-helper.service";
import { ConfigService } from "src/common/config/config.service";
import { KafkaService } from "src/common/kafka/kafka.service";
import { ErrorService } from "src/common/services/errorService";
import { AvatarResolver } from "./Avatar.resolver";
import { AvatarService } from "./Avatar.service";
import { NotificationEngine } from "src/common/services/notification_engine";
import { Event, EventSchema } from "src/common/database/entities/events.entity";
import {
  Ownership,
  ownershipSchema,
} from "src/common/database/entities/meta/ownership.entity";
import {
  Advertiser,
  AdvertiserSchema,
} from "src/common/database/entities/advertiser.entity";
import {
  Organizer,
  OrganizerSchema,
} from "src/common/database/entities/organizer.entity";
import {
  Vendor,
  VendorSchema,
} from "src/common/database/entities/vendor.entity";
import {
  Banner,
  BannerSchema,
} from "src/common/database/entities/banner.entity";
import {
  Venue,
  VenueSchema,
} from "src/common/database/entities/meta/venue.entity";
import { Props, PropsSchema } from "src/common/database/entities/meta.entities";
import { Kiosk, KioskSchema } from "src/common/database/entities/kiosk.entity";
import {
  VendorEvent,
  VendorEventSchema,
} from "src/common/database/entities/vendorEvent.entity";
import { LoggingService } from "src/common/logging/logging.service";
import { NotificationEngineService } from "src/common/services/notificatioService";
import { Gallery, GallerySchema } from "src/common/database/entities/gallery.entity";
import { Analytics, AnalyticsSchema } from "src/common/database/entities/analytics.entity";
import { AuthEngine } from "src/common/services/auth_engine";
import { EventDebatePolls, EventDebatePollsModelSchema } from "src/common/database/entities/debatepolls.entity";

@Module({
  imports: [
    ConfigurationModule,
    LoggingModule,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: EventDebatePolls.name, schema: EventDebatePollsModelSchema},
      { name: Vendor.name, schema: VendorSchema },
      { name: Venue.name, schema: VenueSchema },
      { name: Organizer.name, schema: OrganizerSchema },
      { name: Artist.name, schema: ArtistSchema },
      { name: Ownership.name, schema: ownershipSchema },
      { name: Advertiser.name, schema: AdvertiserSchema },
      { name: Banner.name, schema: BannerSchema },
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: Props.name, schema: PropsSchema },
      { name: Kiosk.name, schema: KioskSchema },
      { name: VendorEvent.name, schema: VendorEventSchema },
      { name: Gallery.name, schema: GallerySchema },
    ]),
  ],
  providers: [
    RedisHelperService,
    LoggingService,
    ErrorService,
    KafkaService,
    ConfigService,
    AvatarResolver,
    AvatarService,
    NotificationEngine,
    NotificationEngineService,
    AuthEngine
  ],
  exports: [AvatarService],
})
export class AvatarModule {}
