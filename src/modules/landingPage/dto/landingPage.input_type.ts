import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, Length, NotContains, Validate } from "class-validator";
import { ERROR_MESSAGES } from "src/common/config/constants";
import {
  FrontAndBackSpacesAndSpecialSymbols,
  RemoveWhiteSpaces,
} from "src/common/shared/inputValidator";

@InputType()
export class EventsFilter {
  @Field(() => String, { nullable: true })
  categoryId: string;

  @Field(() => String, { nullable: true })
  sortBy: string;

  @Field(() => String, { nullable: true })
  language: string;

  @Field(() => Boolean, { nullable: true })
  isLive: boolean;

  @Field(() => String, { nullable: true })
  eventName: string;
}
@InputType()
export class OrganizerInput {
  @Field(() => String)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @Validate(FrontAndBackSpacesAndSpecialSymbols, {
    message: ERROR_MESSAGES.ORG_NAME_ERROR_MSG,
  })
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.ORGANIZER_EMPTY_NAME,
  })
  @Length(1, 32, {
    message: ERROR_MESSAGES.ORG_NAME_LENGTH,
  })
  organizer: string;
}
