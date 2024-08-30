import { Args, Context, Mutation, Query } from "@nestjs/graphql";
import { Resolver } from "@nestjs/graphql";
import { ArtistService } from "./artist.service";
import {
  addArtistInput,
  onboardArtist,
  setpasswordInput,
} from "./dto/artist.input_types";
import {
  GetArtistTracksInput,
  SetArtistPerformanceMode,
  UploadArtistTracksInput,
  organizeArtistTracksInput,
} from "./dto/artist.input_types";
import {
  OnboardArtistResponse,
  setPasswordResponse,
  GetArtistPerformanceMode,
  ArtistDetailsResponse,
  GetArtistTrackResponse,
  SetArtistPerformance,
} from "./dto/artist.response";
import { PaginationInput } from "src/common/shared/common.input_type";
import { ERROR_MESSAGES, REGEX } from "src/common/config/constants";
import {
  UploadBannerResponse,
} from "../venue/dto/venue.response";
import JSON from "graphql-type-json";
import { DeleteBannerInput } from "../event/dto/event.input_type";
import { ErrorService } from "src/common/services/errorService";
import { isValidUrl } from "src/common/helper/helper";
@Resolver()
export class ArtistResolver {
  constructor(private readonly artistService: ArtistService,
    private readonly errorService: ErrorService,
  ) { }

  @Query(() => [ArtistDetailsResponse])
  async getArtistDetails(
    @Args("name", { nullable: true }) name: string,
    @Args("eventId") eventId: string,
    @Args("paginationInput") pagination: PaginationInput,
    @Context() context: any
  ) {
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.artistService.getArtistDetails(
      name,
      eventId,
      pagination,
      context.req.loginResponse
    );
  }

  @Mutation(() => OnboardArtistResponse)
  async onboardArtist(
    @Args("addArtistInput") addArtistInput: addArtistInput,
    @Context() context: any
  ) {
    return await this.artistService.onboardArtist(
      addArtistInput,
      context.req.loginResponse
    );
  }

  @Mutation(() => setPasswordResponse)
  async updateArtist(
    @Args("ArtistInput") ArtistInput: onboardArtist,
    @Context() context: any
  ) {
    if (!!ArtistInput.description) {
      if (
        ArtistInput.description.length < 1 ||
        ArtistInput.description.length > 120
      ) {
        return new Error(ERROR_MESSAGES.DESCRIPTION_ERROR);
      }
    }
    if (!!ArtistInput.tags || ArtistInput.tags) {
      const uniqueTags = new Set();
      ArtistInput.tags = ArtistInput.tags.map((tag) => {
        const trimmedTag = tag.trim().replace(/\s+/g, " ");
        // Check for empty strings
        if (trimmedTag === "") {
          throw new Error(ERROR_MESSAGES.ARRAY_STRINGS_ERROR);
        }
        // Check for duplicate values
        if (uniqueTags.has(trimmedTag)) {
          throw new Error(`${ERROR_MESSAGES.DUPLICATE_FOUND} ${trimmedTag}`);
        }
        uniqueTags.add(trimmedTag);
        return trimmedTag;
      });
    }
    const { socialMedia } = ArtistInput;
    const invalidUrls = [];
    if (socialMedia) {
      if (socialMedia.instaLink && !isValidUrl(socialMedia.instaLink)) {
        invalidUrls.push('instaLink');
      }
      if (socialMedia.facebookLink && !isValidUrl(socialMedia.facebookLink)) {
        invalidUrls.push('facebookLink');
      }
      if (socialMedia.twitterLink && !isValidUrl(socialMedia.twitterLink)) {
        invalidUrls.push('twitterLink');
      }
    }

    if (invalidUrls.length > 0) {
      return {
        isOk: false,
        message: `Invalid URL(s): ${invalidUrls.join(', ')}`,
      };
    }
    return await this.artistService.updateArtist(
      ArtistInput,
      context.req.loginResponse
    );
  }

  @Query(() => ArtistDetailsResponse)
  async artistProfile(@Context() context: any) {
    return await this.artistService.artistProfile(context.req.loginResponse);
  }

  @Mutation(() => setPasswordResponse)
  async setPassword(
    @Args("setPassword") setpasswordInput: setpasswordInput,
    @Args("isArtist", { nullable: true, defaultValue: false }) isArtist: boolean
  ) {
    return await this.artistService.setPassword(setpasswordInput, isArtist);
  }

  // used for modifying the artist performance type : Music / Live
  @Mutation(() => SetArtistPerformance)
  async setArtistPerformanceType(
    @Args("setArtistPerformanceType")
    setArtistPerformanceType: SetArtistPerformanceMode,
    @Context() context: any
  ) {
    if (setArtistPerformanceType.isVideoEnabled && (!setArtistPerformanceType.videoURL)) {
      this.errorService.error({ message: "Required URL is not provided" }, 400);
    }
    if (!setArtistPerformanceType.isVideoEnabled && (!!setArtistPerformanceType.videoURL)) {
      this.errorService.error({ message: "Enable video streaming" }, 400);
    }
    return await this.artistService.setArtistPerformanceType(setArtistPerformanceType, context.req.loginResponse)
  }
  @Query(() => GetArtistPerformanceMode)
  async getArtistPerformanceType(
    @Args("input") input: GetArtistTracksInput,
    @Context() context: any
  ) {
    return await this.artistService.getArtistPerformanceType(
      input,
      context.req.loginResponse
    );
  }

  @Mutation(() => UploadBannerResponse)
  async uploadArtistTracks(
    @Args("input") input: UploadArtistTracksInput,
    @Context() context: any
  ) {
    return await this.artistService.uploadArtistTracks(
      input,
      context.req.loginResponse
    );
  }

  @Query(() => [GetArtistTrackResponse])
  async getArtistTracks(
    @Args("input") input: GetArtistTracksInput,
    @Context() context: any
  ) {
    return await this.artistService.getArtistTracks(
      input,
      context.req.loginResponse
    );
  }

  @Mutation(() => UploadBannerResponse)
  async deleteArtistTracks(
    @Args("input") input: DeleteBannerInput,
    @Context() context: any
  ) {
    return await this.artistService.deleteArtistTracks(
      input,
      context.req.loginResponse
    );
  }

  @Mutation(() => UploadBannerResponse)
  async organizeArtistTracks(
    @Args("input") input: organizeArtistTracksInput,
    @Context() context: any
  ) {
    return await this.artistService.organizeArtistTracks(
      input,
      context.req.loginResponse
    );
  }
}
