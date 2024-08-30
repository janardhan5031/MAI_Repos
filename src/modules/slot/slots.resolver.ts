import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { SlotService } from "./slots.service";
import { CreateSlotInput } from "./dto/slot.input_type";
import {
  GetSlotDates,
  GetSlotResponsewithartist,
  GetSlotTime,
  allslotsResponse,
  slotResponse,
} from "./dto/slot.response";
import { PaginationInput } from "src/common/shared/common.input_type";

import JSON from "graphql-type-json";
import { ERROR_MESSAGES, REGEX } from "src/common/config/constants";
@Resolver()
export class SlotResolver {
  constructor(
    private readonly slotService: SlotService,
  ) {}

  // create slot in event
  @Query(() => allslotsResponse)
  async getallslotsbyEventId(
    @Args("eventId") eventId: string,
    @Args("paginationInput") pagination: PaginationInput,
    @Context() context: any
  ) {
    if (eventId === null || eventId === undefined || eventId === "") {
      return new Error(ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR);
    }
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    eventId = eventId.trim();
    return await this.slotService.getallslotsbyEventId(
      eventId,
      pagination,
      context.req.loginResponse,
      context.req.userTimeZone
    );
  }

  @Query(() => GetSlotResponsewithartist)
  async getslotbyId(
    @Args("slotId") slotId: string,
    @Context() context: any
  ) {
    if (slotId === null || slotId === undefined || slotId === "") {
      return new Error(ERROR_MESSAGES.SLOT_ID_EMPTY_ERROR);
    }
    if (!slotId || !REGEX.OBJECTID_REGEX.test(slotId)) {
      return new Error(ERROR_MESSAGES.INVALID_SLOT_ID);
    }
    slotId = slotId.trim();
    return await this.slotService.getallslotbyId(
      slotId,
      context.req.loginResponse,
      context.req.userTimeZone
    );
  }

  // create slot in event
  @Mutation(() => slotResponse)
  async createEventSlot(
    @Args("createEventSlot") input: CreateSlotInput,
    @Context() context: any
  ) {
    return await this.slotService.addSlot(input, context.req.loginResponse,context.req.userTimeZone);
  }

  @Mutation(() => slotResponse)
  async deleteSlot(@Args("slotId") slotId: string,
   @Context() context: any) {
   
    return await this.slotService.deleteSlots(
      slotId,
      context.req.loginResponse,
      context.req.userTimeZone
    );
  }
  @Query(() => GetSlotDates)
  async getSlotDates(
    @Args("eventId") eventId: string,
    @Args("artistId") artistId: string,
    @Context() context: any
  ) {
    if (!eventId) {
      return new Error(ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR);
    }
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    if (!artistId) {
      return new Error(ERROR_MESSAGES.ARTIST_ID_EMPTY_ERROR);
    }
    if (!artistId || !REGEX.OBJECTID_REGEX.test(artistId)) {
      return new Error(ERROR_MESSAGES.INVALID_ARTIST_ID);
    }
    return await this.slotService.getSlotDate(eventId, artistId, context.req.loginResponse,context.req.userTimeZone);
  }
  @Query(() => GetSlotTime)
  async getSlotTime(
    @Args("eventId") eventId: string,
    @Args("artistId") artistId: string,
    @Args("date") date: Date,
    @Context() context: any
  ) {
    if (!eventId) {
      return new Error(ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR);
    }
    if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    if (!artistId) {
      return new Error(ERROR_MESSAGES.ARTIST_ID_EMPTY_ERROR);
    }
    if (!artistId || !REGEX.OBJECTID_REGEX.test(artistId)) {
      return new Error(ERROR_MESSAGES.INVALID_ARTIST_ID);
    }
    if (date === null || isNaN(date.getTime())) {
      return new Error(ERROR_MESSAGES.INVALID_START_DATE);
    }
    return await this.slotService.getSlotTime(eventId, artistId, date, context.req.loginResponse,context.req.userTimeZone);
  }
  @Query((returns) => JSON)
  async getSlotDuration(
    @Args("eventId") eventId: string,
    @Args("artistId") artistId: string,
    @Args("date") date: Date,
    @Args("slotTime") slotTime: string ,
    @Context() context: any ) {
      if (!eventId) {
        return new Error(ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR);
      }
      if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
        return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
      }
      if (!artistId) {
        return new Error(ERROR_MESSAGES.ARTIST_ID_EMPTY_ERROR);
      }
      if (!artistId || !REGEX.OBJECTID_REGEX.test(artistId)) {
        return new Error(ERROR_MESSAGES.INVALID_ARTIST_ID);
      }
      if (date === null || isNaN(date.getTime())) {
        return new Error(ERROR_MESSAGES.INVALID_START_DATE);
      }
      if(!slotTime){
        return new Error(ERROR_MESSAGES.SLOT_TIME_ERROR)
      }
      if(!!slotTime){
        if (/:/.test(slotTime) == false) {
          return new Error(ERROR_MESSAGES.INVALID_START_TIME);
        }
    
        const [hours, minutes] = slotTime.split(":").map(Number);
        if (isNaN(hours) || isNaN(minutes))  return new Error(ERROR_MESSAGES.INVALID_START_TIME);;
        if (hours > 24 || (( minutes != 0 && minutes != 15 &&  minutes != 30 &&  minutes != 45 )) || (hours == 24 && minutes > 0))
        return new Error(ERROR_MESSAGES.INVALID_START_TIME);
      }
    return await this.slotService.getSlotDurtaion(eventId, artistId, date, slotTime, context.req.loginResponse,context.req.userTimeZone);
  }
}
