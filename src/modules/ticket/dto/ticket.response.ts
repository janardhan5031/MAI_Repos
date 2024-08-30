import { Field, ObjectType } from "@nestjs/graphql";
@ObjectType()
export class TicketDetailsResponse {
  @Field(() => Number)
  ticketPrice: number;

  @Field(() => Number)
  ticketCount: number;

  @Field(() => String, {nullable : true})
  csvLink: string;

  @Field(() => String, {nullable : true})
  csvName: string;

  @Field(() => String)
  eventId: string;

  @Field(() => Boolean)
  isFreeEntry: boolean;

  @Field(() => Number)
  seats: number;
}
