import { Field, InputType } from "@nestjs/graphql";
import { IsInt, IsNotEmpty, IsOptional, NotContains, Validate } from "class-validator";
import { ERROR_MESSAGES } from "src/common/config/constants";
import {
  IsObjectId,
  IsValidDate,
  IsValidSlotTime,
  IsValidSlotendTime,
  IsValidTime,
  IsValidendTime,
  RemoveWhiteSpaces,
} from "src/common/shared/inputValidator";
import { EventIdValidation } from "src/modules/event/dto/event.input_type";

@InputType()
export class CreateSlotInput extends EventIdValidation {
  @Field(() => Date,{ nullable: true })
  @IsOptional()
  @Validate(IsValidDate, { message: ERROR_MESSAGES.INVALID_START_DATE })
  startDate?: Date;

  @Field(() => String,{ nullable: true })
  @IsOptional()

  @Validate(IsValidSlotTime, { message: ERROR_MESSAGES.INVALID_START_TIME })
  slotTime?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Validate(IsValidSlotendTime, { message: ERROR_MESSAGES.INVALID_START_TIME })
  endTime?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt({
    message: ERROR_MESSAGES.INVALID_DURATION_FORMAT_ERROR, // Custom error message
  })
  duration?: number
  
  @Field(() => String, { nullable: true })
  @IsObjectId({
    message: ERROR_MESSAGES.INVALID_ARTIST_ID
  })
  @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.ARTIST_ID_EMPTY_ERROR })
  artistId: string;

  @Field(() => String, { nullable: true })
  slotId: string;
}

@InputType()
export class SlotIdValidation {
  @Field(() => String)
  @IsObjectId({
    message: ERROR_MESSAGES.INVALID_SLOT_ID,
  })
  @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.SLOT_ID_EMPTY_ERROR })
  slotId: string;
}
