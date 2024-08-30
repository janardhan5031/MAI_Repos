import { Field, InputType, Int, registerEnumType } from "@nestjs/graphql";
import { IsEnum, NotContains, Validate } from "class-validator";
import { ERROR_MESSAGES, VenueType } from "src/common/config/constants";
import {
  HasNumbers,
  HaveFrontAndBackSpaces,
  IsObjectId,
  IsWholeNumber,
  RemoveWhiteSpaces,
} from "src/common/shared/inputValidator";

@InputType()
export class UpdateVenueInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => Number, { nullable: true })
  userCount?: number;

  @Field(() => VenueType, { nullable: true })
  venueType?: VenueType;

  @Field(() => Number, { nullable: true })
  holograms?: number;

  @Field(() => Number, { nullable: true })
  stages?: number;

  @Field(() => Number, { nullable: true })
  banner?: number;

  @Field(() => [String], { nullable: true })
  kiosk?: [string];
}

@InputType()
class VectorInput {
  @Field()
  x: number;

  @Field()
  y: number;

  @Field()
  z: number;
}

@InputType()
export class TransformInput {
  @Field(() => VectorInput)
  position: VectorInput;

  @Field(() => VectorInput)
  rotation: VectorInput;

  @Field(() => VectorInput)
  scale: VectorInput;
}

@InputType()
export class CreateProp {
  @Field(() => String)
  category: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  mediaLink: string;

  @Field(() => TransformInput)
  transform: TransformInput;
}

@InputType()
export class AddVenueInput {
  @Field(() => String)
  @NotContains("undefined")
  @NotContains("null")
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.VENUE_NAME_EMPTY,
  })
  @Validate(HaveFrontAndBackSpaces, {
    message: ERROR_MESSAGES.VENUE_NAME_NO_SPACES,
  })
  @Validate(HasNumbers, {
    message: ERROR_MESSAGES.VENUE_NAME_ALPHABETS_SPECIAL_CHARS,
  })
  name: string;
  @Field(() => Number)
  @Validate(IsWholeNumber, {
    message: ERROR_MESSAGES.VALID_USER_COUNT,
  })
  userCount: number;

  @Field(() => Number)
  @Validate(IsWholeNumber, {
    message: ERROR_MESSAGES.VALID_HOLOGRAMS_NUMBER,
  })
  holograms: number;

  @Field(() => Number)
  @Validate(IsWholeNumber, {
    message: ERROR_MESSAGES.VALID_STAGES_NUMBER,
  })
  stages: number;

  @Field(() => VenueType)
  @NotContains("undefined")
  @NotContains("null")
  @IsEnum(VenueType, {
    message: ERROR_MESSAGES.VENUE_TYPE_VALID,
  })
  venueType: VenueType;

  @Field(() => Number)
  @Validate(IsWholeNumber, {
    message: ERROR_MESSAGES.VALID_BANNER_NUMBER,
  })
  banner: number;

  @Field(() => Number)
  kiosk: number;

  @Field(() => [CreateProp])
  props: CreateProp[];

  @Field(() => VectorInput)
  location: VectorInput;

  @Field(() => String)
  sceneName: String;
}
@InputType()
export class AddVenueToEventInput {
  @Field(() => String)
  eventId: string;

  @Field(() => String)
  venueId: string;
}

@InputType()
export class paymentInput {
  @Field(() => String)
  transactionId: string;

  @Field(() => Number)
  price: number;
}
