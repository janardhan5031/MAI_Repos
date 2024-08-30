import { Field, InputType } from "@nestjs/graphql";
import { IsInt } from "class-validator";
import { ERROR_MESSAGES } from "src/common/config/constants";

@InputType()
export class AddTicket {
  @Field(() => Number)
  @IsInt({message:ERROR_MESSAGES.TICKET_PRICE_INTEGER})
  ticketPrice: number;

  @Field(() => Number)
  @IsInt({message:ERROR_MESSAGES.TICKET_COUNT_INTEGER})
  ticketCount: number;

  @Field(() => Boolean,{defaultValue:false})
  isFreeEntry: boolean;
}



