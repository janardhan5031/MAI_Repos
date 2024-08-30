import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { ConfigurationModule } from "./common/config/config.module";
import { ConfigurationService } from "./common/config/config.service";
import { LoggingModule } from "./common/logging/logging.module";
import { RedisHelperService } from "./common/redis-helpers/redis-helper.service";
import { CachingModule } from "./common/caching/caching.module";
import { ArtistModule } from "./modules/artist/artist.module";
import { EventModule } from "./modules/event/events.module";
import { SlotModule } from "./modules/slot/slots.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuthMiddleware } from "./common/middleware/auth-middleware";
import { MongodbModule } from "./common/database/config";
import { formatError } from "./common/services/error-formating";
import { ErrorService } from "./common/services/errorService";
import { TicketModule } from "./modules/ticket/ticket.module";
import { InputManipulationService } from "./common/shared/input_manipulation";
import { EventCategoriesModule } from "./modules/eventCategories/categories.module";
import { LanguageModule } from "./modules/languages/languages.module";
import { VenueModule } from "./modules/venue/venue.module";
import { AdvertiserModule } from "./modules/advertiser/advertiser.module";
import { VendorModule } from "./modules/vendor/vendor.module";
import { ScheduleModule } from "@nestjs/schedule";
import { CronModule } from "./common/cron/cron.module";
import { AuthEngine } from "./common/services/auth_engine";
import { AvatarModule } from "./modules/Avatar/Avatar.module";
import { GalleryModule } from "./modules/gallery/gallery.module";
import { MongooseModule } from "@nestjs/mongoose";
import { Artist, ArtistSchema } from "./common/database/entities/artist.entity";
import { KafkaService } from "./common/kafka/kafka.service";
import { Event, EventSchema } from "./common/database/entities/events.entity";
import { Vendor, VendorSchema } from "./common/database/entities/vendor.entity";
import {
  Venue,
  VenueSchema,
} from "./common/database/entities/meta/venue.entity";
import {
  Organizer,
  OrganizerSchema,
} from "./common/database/entities/organizer.entity";
import {
  Ownership,
  ownershipSchema,
} from "./common/database/entities/meta/ownership.entity";
import { Banner, BannerSchema } from "./common/database/entities/banner.entity";
import { Props, PropsSchema } from "./common/database/entities/meta.entities";
import { Kiosk, KioskSchema } from "./common/database/entities/kiosk.entity";
import {
  VendorEvent,
  VendorEventSchema,
} from "./common/database/entities/vendorEvent.entity";
import {
  Gallery,
  GallerySchema,
} from "./common/database/entities/gallery.entity";
import { Advertiser } from "./common/database/entities/advertiser.entity";
import { NotificationEngine } from "./common/services/notification_engine";
import { NotificationEngineService } from "./common/services/notificatioService";
import {
  Analytics,
  AnalyticsSchema,
} from "./common/database/entities/analytics.entity";
import { PaymentEngine } from "./common/services/paymentService";
import { LandingPageModule } from "./modules/landingPage/landingPage.module";
import { ThrottlerModule } from "@nestjs/throttler";
import { EventDebatePolls, EventDebatePollsModelSchema } from "./common/database/entities/debatepolls.entity";
import { APP_GUARD } from "@nestjs/core";
import {  ThrottlerGraphQLGruard } from "./common/middleware/customGuard";
@Module({
  imports: [
    ConfigurationModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory: (configService: ConfigurationService) => ({
          ttl: configService.get('THROTTLE_TTL'),
          limit: configService.get('THROTTLE_LIMIT'),
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (configService: ConfigurationService) => ({
        debug: configService.get("ENABLE_GRAPHQL_DEBUG"),
        playground: configService.get("ENABLE_GRAPHQL_PLAYGROUND"),
        introspection: configService.get("ENABLE_GRAPHQL_INTROSPECTION"),
        autoSchemaFile: join(process.cwd(), "src/schema.gql"),
        sortSchema: true,
        formatError: formatError,
        context: ({ req, res }) => ({ req, res }),
      }),
      inject: [ConfigurationService],
      imports: [ConfigurationModule, ScheduleModule.forRoot()],
    }),
    MongodbModule,
    CachingModule,
    LoggingModule,
    ArtistModule,
    EventModule,
    SlotModule,
    VenueModule,
    AuthModule,
    LandingPageModule,
    AdvertiserModule,
    VendorModule,
    CronModule,
    TicketModule,
    EventCategoriesModule,
    LanguageModule,
    AvatarModule,
    GalleryModule,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: EventDebatePolls.name, schema: EventDebatePollsModelSchema},
      { name: Vendor.name, schema: VendorSchema },
      { name: Venue.name, schema: VenueSchema },
      { name: Organizer.name, schema: OrganizerSchema },
      { name: Artist.name, schema: ArtistSchema },
      { name: Ownership.name, schema: ownershipSchema },
      { name: Advertiser.name, schema: ArtistSchema },
      { name: Banner.name, schema: BannerSchema },
      { name: Props.name, schema: PropsSchema },
      { name: Analytics.name, schema: AnalyticsSchema },
      { name: Kiosk.name, schema: KioskSchema },
      { name: VendorEvent.name, schema: VendorEventSchema },
      { name: Gallery.name, schema: GallerySchema },
    ]),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGraphQLGruard,
    },
    AppService,
    RedisHelperService,
    ErrorService,
    PaymentEngine,
    InputManipulationService,
    AuthEngine,
    NotificationEngine,
    NotificationEngineService,
    KafkaService,
  ],
  exports: [CachingModule, PaymentEngine],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes("*");
    consumer.apply(AuthMiddleware).forRoutes("/upload_file");
    consumer.apply(AuthMiddleware).forRoutes("/upload_files");
    consumer.apply(AuthMiddleware).forRoutes("/uploadArtistTracks");
    consumer.apply(AuthMiddleware).forRoutes("/updateAvatar");
  }
}
