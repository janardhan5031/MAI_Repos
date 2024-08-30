import { Args, Context, Mutation, Query } from "@nestjs/graphql";
import { Resolver } from "@nestjs/graphql";
import { AdvertiserService } from "./advertiser.service";
import {
  AdvertiserDetailsResponse,
  AdvertiserEventDetails,
  AdvertiserResponse,
} from "./dto/advrtiser.response";
import { PaginationInput } from "src/common/shared/common.input_type";
import { ERROR_MESSAGES, REGEX } from "src/common/config/constants";
@Resolver()
export class AdvertiserResolver {
  constructor(private readonly advertiserService: AdvertiserService) {}

  @Query(() => [AdvertiserResponse])
  async getAdvertiserDetails(
    @Args("name", { nullable: true }) name: string,
    @Args("eventId") eventId: string,
    @Context() context: any
  ) {
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.advertiserService.getAdvertisers(
      name,
      eventId,
      context.req.loginResponse
    );
  }

  @Mutation(() => AdvertiserDetailsResponse)
  async addAdvertisertoEvent(
    @Args("advertiserId") advertiserId: string,
    @Args("eventId") eventId: string,
    @Context() context: any
  ) {
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    if (!advertiserId || !REGEX.OBJECTID_REGEX.test(advertiserId)) {
      return new Error(ERROR_MESSAGES.INVALID_ADVERTISERID);
    }
    return await this.advertiserService.updateAdvertiser(
      advertiserId,
      eventId,
      context.req.loginResponse,
      context.req.userTimeZone
    );
  }

  @Mutation(() => AdvertiserDetailsResponse)
  async deleteAdvertiser(
    @Args("advertiserId") advertiserId: string,
    @Args("eventId") eventId: string,
    @Context() context: any
  ) {
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    if (!advertiserId || !REGEX.OBJECTID_REGEX.test(advertiserId)) {
      return new Error(ERROR_MESSAGES.INVALID_ADVERTISERID);
    }
    return await this.advertiserService.deleteAdvertiser(
      advertiserId,
      eventId,
      context.req.loginResponse,
      context.req.userTimeZone
    );
  }

  @Query(() => AdvertiserEventDetails)
  async getAdvertisersbyeventId(
    @Args("eventId") eventId: string,
    @Args("paginationInput") pagination: PaginationInput,
    @Context() context: any
  ) {
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.advertiserService.getAdvertisersbyeventId(
      eventId,
      pagination,
      context.req.loginResponse
    );
  }
}
