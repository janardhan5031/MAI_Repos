import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { VenueService } from "./venue.service";
import { paymentInput } from "./dto/venue.input_type";
import { String } from "aws-sdk/clients/acm";
import {
  DeleteBannerInput,
  EventDateInput,
  GetBannerInput,
  UploadBannerInput,
} from "../event/dto/event.input_type";
import { PaginationInput } from "src/common/shared/common.input_type";
import {
  GetBannerDetailResponse,
  GetLatestDatesResponse,
  UploadBannerResponse,
  VenueResponse,
  VenueResponseData,
  referenceDetails,
} from "./dto/venue.response";
import { ERROR_MESSAGES, REGEX } from "src/common/config/constants";
import { isValidUUID } from "src/common/helper/helper";
import { TimeConversionHelperService } from "src/common/helper/timezone";
const moment = require("moment-timezone");
require("moment-timezone");

@Resolver()
export class VenueResolver {
  constructor(
    private readonly venueService: VenueService,
    private readonly timezoneService: TimeConversionHelperService,
  ) { }

  @Query(() => VenueResponseData)
  async getVenues(
    @Args("eventDates") eventDates: EventDateInput,
    @Args("paginationInput") pagination: PaginationInput,
    @Args("eventId") eventId: string,
    @Context() context: any
  ) {
    let startDate = new Date(eventDates.startDate)
    let endDate = new Date(eventDates.endDate)
    return await this.venueService.getVenues(
      eventDates,
      pagination,
      eventId,
      context.req.loginResponse,
      context.req.userTimeZone
    );
  }

  @Query(() => referenceDetails)
  async generateReferenceNumber(
    @Args("eventDates") eventDates: EventDateInput,
    @Args("venueId") venueId: string,
    @Args("eventId") eventId: string,
    @Context() context: any
  ) {
    if (!venueId || !/^[0-9a-fA-F]{24}$/.test(venueId)) {
      return new Error(ERROR_MESSAGES.VENUE_ID_NOT_FOUND);
    }
    if (!eventId || !/^[0-9a-fA-F]{24}$/.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.venueService.generateReferenceNumber(
      eventDates,
      venueId,
      eventId,
      context.req.loginResponse,
      context.req.userTimeZone
    );
  }
  @Mutation(() => VenueResponse)
  async validateTransaction(
    @Args("transcationId") transcationId: string,
    @Args("eventId") eventId: string,
    @Context() context: any
  ) {
    if (!transcationId || !isValidUUID(transcationId)) {
      return new Error(ERROR_MESSAGES.INVALID_TRANSCATION_ID);
    }
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.venueService.validateTransaction(
      transcationId,
      eventId,
      context.req.loginResponse,
      context.req.paymentSkip
    );
  }

  @Query(() => GetLatestDatesResponse)
  async getLatestDates(
    @Args("eventId") eventId: string,
    @Context() context: any) {
    return await this.venueService.getlatestDates(
      eventId,
      context.req.loginResponse,
      context.req.userTimeZone
    );
  }

  @Mutation(() => UploadBannerResponse)
  async uploadBanner(
    @Args("input") input: UploadBannerInput,
    @Context() context: any
  ) {
    return await this.venueService.uploadBanner(
      input,
      context.req.loginResponse
    );
  }

  @Query(() => GetBannerDetailResponse)
  async getBannerDetails(
    @Args("input") input: GetBannerInput,
    @Context() context: any
  ) {
    return await this.venueService.getBannerDetails(
      input,
      context.req.loginResponse
    );
  }

  @Mutation(() => UploadBannerResponse)
  async deleteAssets(
    @Args("input") input: DeleteBannerInput,
    @Context() context: any
  ) {
    return await this.venueService.deleteBannerAssets(
      input,
      context.req.loginResponse
    );
  }
}
