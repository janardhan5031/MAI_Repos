import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { PaginationInput } from "src/common/shared/common.input_type";

import JSON from "graphql-type-json";
import { ERROR_MESSAGES, REGEX } from "src/common/config/constants";
import { LandingPageService } from "./landingPage.service";
import { LatestArtistsDTO, OrganizerProfileDetails, PreviousEventsResponse, SearchEventResponse, organizerFavourites } from "./dto/landingPage.response";
import { EventsFilter, OrganizerInput } from "./dto/landingPage.input_type";
import { MediaResponse } from "../gallery/Dto/gallery.response";
@Resolver()
export class LandingPageResolver {
  constructor(
    private readonly landingPageService: LandingPageService,
  ) {

  }
  @Query(() => SearchEventResponse) // Query to get events with search and filter
  async searchEvents(
    @Args("paginationInput") pagination: PaginationInput,
    @Args("filter", { nullable: true }) filter: EventsFilter,
    @Args("organizer") organizer: string,
    @Context() context: any
  ) {
    if (filter.categoryId && !REGEX.OBJECTID_REGEX.test(filter.categoryId)) {
      return new Error(ERROR_MESSAGES.INVALID_CATEGORY);
    }
    if (!organizer) {
      return new Error(ERROR_MESSAGES.INVALID_ORGANIZER);
    }

    if (filter.language && !REGEX.OBJECTID_REGEX.test(filter.language)) {
      return new Error(ERROR_MESSAGES.INVALID_LANGUAGE);
    }

    return await this.landingPageService.searchAndSortEvent(pagination, organizer, filter);
  }
  @Query(() => PreviousEventsResponse)
  async previousEvents(
    @Args("paginationInput") pagination: PaginationInput,
    @Args("organizer") organizer: string,
    @Context() context: any) {

    return await this.landingPageService.previousEvents(
      organizer,
      pagination,
    );
  }
  @Query(() => OrganizerProfileDetails)
  async organizerProfile(
    @Args("organizer") organizer: string,
    @Context() context: any) {
    return await this.landingPageService.organizerProfile(
      organizer,
    );
  }
  @Query(() => LatestArtistsDTO)
  async latestArtistAndGallery(
    @Args("organizer") organizer: string,
    @Context() context: any) {
    return await this.landingPageService.latestArtistAndGallery(
      organizer,
    );
  }

  @Query(() => [organizerFavourites])
  async getOrganizerFavorites(@Args("input") input: OrganizerInput) {
    return await this.landingPageService.getOrganizerFavorites(input.organizer);
  }
}
