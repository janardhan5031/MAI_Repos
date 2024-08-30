import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { GalleryService } from "./gallery.service";
import { isValidObjectId } from "mongoose";
import { GetGalleryResponse } from "./Dto/gallery.response";
import { NewEntryResponse } from "src/common/shared/common.responses";
import { ERROR_MESSAGES } from "src/common/config/constants";
import { SkipThrottle } from "@nestjs/throttler";

@Resolver()
export class GalleryResolver {
  constructor(private readonly galleryService: GalleryService) { }

  @Query(() => [GetGalleryResponse])
  @SkipThrottle()
  async getGallery(@Context() context: any, @Args("eventId") eventId: String) {
    if (eventId && !isValidObjectId(eventId)) {
      return new Error("Invalid Event Id");
    }

    return await this.galleryService.getGallery(
      context.req.loginResponse,
      eventId
    );
  }
  @Mutation(() => NewEntryResponse)
  async addToFavorite(
    @Context() context: any,
    @Args("eventId") eventId: String,
    @Args("mediaId") mediaId: String
  ) {
    if (eventId && !isValidObjectId(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    if (mediaId && !isValidObjectId(mediaId)) {
      return new Error(ERROR_MESSAGES.INVALID_MEDIA_ID);
    }

    return await this.galleryService.addToFavorite(
      context.req.loginResponse,
      eventId,
      mediaId
    );
  }
}
