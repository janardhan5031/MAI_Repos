import { Args, Context, Mutation, Query } from "@nestjs/graphql";
import { Resolver } from "@nestjs/graphql";
import { EventService } from "./events.service";
import {
  AddEventInput,
  EventSaleInput,
} from "./dto/event.input_type";
import {
  GetEventDetailsResponse,
  GetEventIdResponse,
  CancelEventResponse,
  GetAllEventResponse,
  updateEventResponse,
  GetProgressResponse,
} from "./dto/event.response";
import {
  EventsFilterInput,
  PaginationInput,
} from "src/common/shared/common.input_type";
import { ArtistService } from "../artist/artist.service";
import { ERROR_MESSAGES, REGEX } from "src/common/config/constants";
import JSON from "graphql-type-json";

@Resolver()
export class EventResolver {
  constructor(
    private readonly eventService: EventService,
    private readonly artistService: ArtistService
  ) { }

  @Query(() => JSON)
  async getOrganiserName(@Args("eventId") eventId: string,) {
    return await this.eventService.getEventOrganiser(eventId);
  }

  @Mutation(() => GetEventIdResponse)
  async createEvent(@Context() context: any) {
    return await this.eventService.createEvent(
      context.req.loginResponse,
      context.req.userTimeZone
    );
  }

  @Mutation(() => updateEventResponse)
  async updateEvent(
    @Args("eventId") eventId: string,
    @Args("AddEventInput") AddEventInput: AddEventInput,
    @Context() context: any
  ) {
    if (!AddEventInput.isKycMandatory && AddEventInput.isAgeRestricted && !AddEventInput.ageLimit) {
      return new Error(ERROR_MESSAGES.AGE_LIMIT_REQUIRED_ERROR);
    }
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    if (!!AddEventInput.tags || AddEventInput.tags) {
      const uniqueTags = new Set();
      for (const tag of AddEventInput.tags) {
        // Check for empty strings
        if (tag === "") {
          throw new Error(ERROR_MESSAGES.TAG_ARRAY_ERROR);
        }
        // Check for duplicate values
        if (uniqueTags.has(tag)) {
          throw new Error(`${ERROR_MESSAGES.DUPLICATE_FOUND} ${tag}`);
        }
        uniqueTags.add(tag);
      }
    }
    if (
      AddEventInput.eventType === null ||
      AddEventInput.eventType === undefined ||
      AddEventInput.eventType === ""
    ) {
      return new Error(ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR);
    }
    if (
      !AddEventInput.eventType ||
      !REGEX.OBJECTID_REGEX.test(AddEventInput.eventType)
    ) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_TYPE);
    }
    for (const id of AddEventInput.languages) {
      if (!id || !REGEX.OBJECTID_REGEX.test(id)) {
        return new Error(ERROR_MESSAGES.LANGUAGES_ARRAY_ERROR);
      }
    }
    return await this.eventService.updateEvent(
      eventId,
      AddEventInput,
      context.req.loginResponse,
      context.req.userTimeZone
    );
  }

  @Query(() => GetEventDetailsResponse)
  async getEventById(
    @Args("eventId") eventId: string,
    @Context() context: any
  ) {
    if (eventId === null || eventId === undefined || eventId === "") {
      return new Error(ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR);
    }
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.eventService.getEventById(
      eventId,
      context.req.loginResponse,
      context.req.userTimeZone
    );
  }

  // get all today's and upcomming events
  @Query(() => GetAllEventResponse)
  async getEvents(
    @Args("paginationInput") pagination: PaginationInput,
    @Args("filter", { nullable: true }) filter: EventsFilterInput,
    @Context() context: any
  ) {
    //if advertiser handling these api.
    if (
      context?.req?.loginResponse?.roles?.includes("EVENT_ARTIST") ||
      context?.req?.loginResponse?.roles?.includes("EVENT_ADVERTISER") ||
      context?.req?.loginResponse?.roles?.includes("EVENT_ORGANIZER")
    ) {
      if (context.req.loginResponse.isOrganizer)
        return await this.eventService.getOrganizerEvents(
          filter,
          pagination,
          context.req.loginResponse,
        );
      else
        return await this.artistService.getArtistsEvents(
          filter,
          pagination,
          context.req.loginResponse,
        );
    }
  }

  @Mutation(() => CancelEventResponse)
  async cancelEvent(
    @Args("eventId") eventId: string,
    @Args("isTermsAgreed") isTermsAgreed: boolean,
    @Context() context: any
  ) {
    if (eventId === null || eventId === undefined || eventId === "") {
      return new Error(ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR);
    }
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.eventService.cancelEvent(
      eventId,
      isTermsAgreed,
      context?.req?.loginResponse,
      context.req.userTimeZone
    );
  }

  @Mutation(() => CancelEventResponse)
  async deleteEvent(@Args("eventId") eventId: string, @Context() context: any) {
    if (eventId === null || eventId === undefined || eventId === "") {
      return new Error(ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR);
    }
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.eventService.deleteEvent(
      eventId,
      context?.req?.loginResponse,
      context.req.userTimeZone
    );
  }

  @Mutation(() => CancelEventResponse)
  async publishEvent(
    @Args("eventId") eventId: string,
    @Context() context: any
  ) {
    if (eventId === null || eventId === undefined || eventId === "") {
      return new Error(ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR);
    }
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.eventService.publishEvent(
      eventId,
      context?.req?.loginResponse,
      context.req.userTimeZone
    );
  }

  @Query(() => CancelEventResponse)
  async checkSaleStatusEvent(
    @Args("eventId") eventId: string,
    @Context() context: any
  ) {
    if (eventId === null || eventId === undefined || eventId === "") {
      return new Error(ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR);
    }
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.eventService.salecheckEvent(
      eventId,
      context?.req?.loginResponse,
      context.req.userTimeZone
    );
  }

  @Mutation(() => CancelEventResponse)
  async eventTicketSale(
    @Args("saleInput") saleInput: EventSaleInput,
    @Args("eventId") eventId: string,
    @Context() context: any
  ) {

    if (eventId === null || eventId === undefined || eventId === "") {
      return new Error(ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR);
    }
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    if (saleInput?.startSaleImmediately) {

      return await this.eventService.saleEvent(
        eventId,
        saleInput,
        context?.req?.loginResponse,
        context.req.userTimeZone
      );
    }
    return await this.eventService.scheduleEvent(
      eventId,
      saleInput,
      context?.req?.loginResponse,
      context.req.userTimeZone
    );
  }

  @Query(() => [String])
  async getEventCategoryBasedFields(@Args("eventId") eventId: string, @Context() context: any) {
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.eventService.getEventCategoryProgress(
      eventId,
      context?.req?.loginResponse
    );
  }

  @Query(() => GetProgressResponse)
  async getProgress(@Args("eventId") eventId: string, @Context() context: any) {
    if (eventId === null || eventId === undefined || eventId === "") {
      return new Error(ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR);
    }
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }

    return await this.eventService.getProgress(
      eventId,
      context?.req?.loginResponse
    );
  }
}
