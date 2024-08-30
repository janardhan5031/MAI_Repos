import { MongooseModule } from "@nestjs/mongoose";
import { ConfigurationModule } from "src/common/config/config.module";
import { Advertiser, AdvertiserSchema } from "src/common/database/entities/advertiser.entity";
import { Artist, ArtistSchema } from "src/common/database/entities/artist.entity";
import { Gallery, GallerySchema } from "src/common/database/entities/gallery.entity";
import { Organizer, OrganizerSchema } from "src/common/database/entities/organizer.entity";
import { LoggingModule } from "src/common/logging/logging.module";
import { LoggingService } from "src/common/logging/logging.service";
import { GalleryResolver } from "./gallery.resolver";
import { GalleryService } from "./gallery.service";
import { Module } from "@nestjs/common";
import { Event, EventSchema } from "src/common/database/entities/events.entity";
import { Favorite, FavoriteSchema } from "src/common/database/entities/favorites.entity";


@Module({
  imports: [
    ConfigurationModule,
    LoggingModule,
    MongooseModule.forFeature([
      { name: Organizer.name, schema: OrganizerSchema },
      { name: Advertiser.name, schema: AdvertiserSchema },
      { name: Artist.name, schema: ArtistSchema },
      { name: Gallery.name, schema: GallerySchema },
      { name: Event.name, schema: EventSchema },
      { name: Favorite.name, schema: FavoriteSchema },
    ]),
  ],
  providers: [LoggingService, GalleryResolver, GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
