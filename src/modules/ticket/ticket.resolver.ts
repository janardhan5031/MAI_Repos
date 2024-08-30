import { Args, Context, Mutation, Query } from "@nestjs/graphql";
import { Resolver } from "@nestjs/graphql";
import { TicketService } from "./ticket.service";
import { AddTicket } from "./dto/ticket.input_types";
import { TicketDetailsResponse } from "./dto/ticket.response";
import { HttpException } from "@nestjs/common";
import { ERROR_MESSAGES } from "src/common/config/constants";

@Resolver()
export class TicketResolver {
  constructor(private readonly ticketService: TicketService) {}

  @Mutation(() => TicketDetailsResponse)
  async updateTicket(
    @Args("eventId") eventId: string,
    @Args("input") addTicket: AddTicket,
    @Context() context: any
  ) {
    if (!eventId || !/^[0-9a-fA-F]{24}$/.test(eventId)) {
      throw new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    if ( !addTicket.isFreeEntry && addTicket.ticketPrice <= 0) {
      return new HttpException(ERROR_MESSAGES.INVALID_PRICE, 400);
    }
    if ( addTicket.isFreeEntry && addTicket.ticketPrice != 0) {
      return new HttpException(ERROR_MESSAGES.INVALID_PRICE_0, 400);
    }
    if (addTicket.ticketCount <= 0) {
      return new HttpException(ERROR_MESSAGES.INVALID_COUNT, 400);
    }
    return this.ticketService.addTicket(
      eventId,
      addTicket,
      context.req.loginResponse
    );
  }

  @Query(() => TicketDetailsResponse)
  async getTicketByEventId(
    @Args("eventId", { nullable: true }) eventId: string,
    @Context() context: any
  ) {
    if (!eventId || !/^[0-9a-fA-F]{24}$/.test(eventId)) {
      throw new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.ticketService.ticket(eventId, context.req.loginResponse);
  }
}
