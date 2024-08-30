import { Field, InputType, registerEnumType } from "@nestjs/graphql";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsUrl,
  Length,
  NotContains,
  Validate,
  ValidateNested,
} from "class-validator";
import { ERROR_MESSAGES } from "src/common/config/constants";
import {
  HaveFrontAndBackSpaces,
  IsObjectId,
  IsValidDate,
  IsValidDates,
  IsValidTime,
  IsValidendTime,
  IsValidsaleStartTime,
  IsWholeNumber,
  RemoveWhiteSpaces,
  UniqueArrayConstraint,
} from "src/common/shared/inputValidator";

@InputType()
export class LanguageIdValidation {
  @Field(() => String)
  @IsObjectId({
    message: ERROR_MESSAGES.INVALID_LANGUGAE_ID,
  })
  @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.EMPTY_LANGUAGE })
  @Validate(HaveFrontAndBackSpaces, {
    message: ERROR_MESSAGES.LANGUAGE_SPACES_ERROR,
  })
  languageId: string;
}

@InputType()
export class EventIdValidation {
  @Field(() => String)
  @IsObjectId({
    message: ERROR_MESSAGES.INVALID_EVENT_ID,
  })
  @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR })
  @Validate(HaveFrontAndBackSpaces, {
    message: ERROR_MESSAGES.EVENT_ID_TRAILING_SPACES_ERROR,
  })
  eventId: string;
}

@InputType()
export class AddEventInput {
  @Field(() => String)
  @NotContains("undefined")
  @NotContains("null")
  @Length(1, 32, {
    message: ERROR_MESSAGES.EVENT_NAME_RANGE_ERROR,
  })
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EVENT_NAME_EMPTY_ERROR,
  })
  eventName: string;

  @Field(() => [String])
  @ArrayNotEmpty({ message: ERROR_MESSAGES.LANGUAGES_EMPTY_ERROR })
  languages: string[];

  @Field(() => String)
  @IsObjectId({
    message: ERROR_MESSAGES.INVALID_CATEGORY_ID,
  })
  @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.CATEGORY_EMPTY_ERROR })
  @Validate(HaveFrontAndBackSpaces, {
    message: ERROR_MESSAGES.CATEGORY_TRAILING_SPACES_ERROR,
  })
  eventType: string;

  @Field(() => String, { nullable: true })
  @IsNotEmpty()
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.DESCRIPTION_EMPTY_ERROR,
  })
  @Length(1, 280, {
    message: ERROR_MESSAGES.DESCRIPTION_RANGE_ERROR,
  })
  description: string;

  @Field(() => [String], { nullable: true })
  @IsNotEmpty()
  tags: string[];

  @Field(() => Boolean)
  @IsNotEmpty()
  isAgeRestricted: boolean;

  @Field(() => Boolean, {defaultValue : false})
  @IsNotEmpty()
  isPrivate: boolean;

  @Field(() => Boolean, { nullable: true })
  isKycMandatory: boolean;

  @Field(() => Number, { nullable: true })
  @Validate(IsWholeNumber, {
    message: ERROR_MESSAGES.AGE_LIMIT_ERROR,
  })
  ageLimit: Number;

  @Field(() => String)
  @IsNotEmpty()
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.COVERPHOTO_ERROR,
  })
  coverPhoto: string;

  @Field(() => String, { nullable: true })
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.THUMBNAIL_EMPTY,
  })
  thumbnail: string;
}

@InputType()
export class EventDateInput {
  @Field(() => String)
  @Validate(IsValidDates, { message: ERROR_MESSAGES.INVALID_START_DATE })
  startDate: string;

  @Field(() => String)
  @Validate(IsValidDates, { message: ERROR_MESSAGES.INVALID_END_DATE })
  endDate: string;

  @Field(() => String)
  @NotContains("undefined")
  @NotContains("null")
  @IsNotEmpty()
  @Validate(IsValidTime, { message: ERROR_MESSAGES.INVALID_START_TIME })
  startTime: string;

  @Field(() => String)
  @NotContains("undefined")
  @NotContains("null")
  @IsNotEmpty()
  @Validate(IsValidendTime, { message: ERROR_MESSAGES.INVALID_END_TIME })
  endTime: string;

  @Field(() => Number, { nullable: true })
  @Validate(IsWholeNumber, {
    message: ERROR_MESSAGES.VALID_DURATION_ERROR,
  })
  duration: number;

  @Field(() => Boolean, { defaultValue: false, nullable: true })
  isTermsAgreed: boolean;
}

@InputType()
export class EventSaleInput {
  @Field(() => Boolean)
  @Validate(Boolean, { message: ERROR_MESSAGES.SALE_START_ERROR })
  startSaleImmediately: Date;

  @Field(() => String, { nullable: true })
  @Validate(IsValidDate, { message: ERROR_MESSAGES.INVALID_START_DATE })
  startDate: string;

  @Field(() => String, { nullable: true })
  @Validate(IsValidsaleStartTime, { message: ERROR_MESSAGES.INVALID_START_TIME })
  startTime: string;
}

@InputType()
export class CategoryIdValidation {
  @Field(() => String)
  @IsObjectId({
    message: ERROR_MESSAGES.INVALID_CATEGORY_ID,
  })
  @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.CATEGORY_EMPTY_ERROR })
  @Validate(HaveFrontAndBackSpaces, {
    message: ERROR_MESSAGES.CATEGORY_TRAILING_SPACES_ERROR,
  })
  categoryId: string;
}

@InputType()
export class BookEventInput extends EventIdValidation {
  @Field(() => Number)
  @IsInt({
    message: ERROR_MESSAGES.INVALID_NUMBER_OF_TICKETS, // Custom error message
  })
  numberOfTickets: number;
}

@InputType()
export class UpdateEventDetails extends EventIdValidation {
  @Field(() => String, { nullable: true })
  Thumbnail: string;

  @Field(() => Number, { nullable: true })
  capacity: Number;

  @Field(() => Date, { nullable: true })
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime: Date;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => [String], { nullable: true })
  assets: string[];

  @Field(() => [String], { nullable: true })
  tags: string[];

  @Field(() => [String], { nullable: true })
  languages: string[];

  @Field(() => Number, { nullable: true })
  ageLimit: Number;

  @Field(() => String, { nullable: true })
  categoryId: string;
}

enum EventStatus {
  DRAFT = "DRAFT",
  UNPUBLISHED = "UNPUBLISHED",
  PUBLISHED = "PUBLISHED",
}
registerEnumType(EventStatus, { name: "EventStatus" });
@InputType()
export class Input {
  @Field(() => EventStatus)
  status: EventStatus;
}

@InputType()
export class Dimensions {
  @Field(() => Number)
  x: number;

  @Field(() => Number)
  y: number;
}

@InputType()
export class LinkMedia {
  @Field(() => String)
  @IsObjectId({
    message: ERROR_MESSAGES.INVALID_ID,
  })
  @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.EMPTY_ID_ERROR })
  @Validate(HaveFrontAndBackSpaces, {
    message: ERROR_MESSAGES.ID_TRAILING_SPACES,
  })
  _id: string;

  @Field(() => String)
  @IsUrl({}, { message: ERROR_MESSAGES.INVALID_URL })
  link: string;

  @Field(() => String)
  fileName: string;

  @Field(() => String)
  type: string;

  @Field(() => Dimensions)
  dimensions: Dimensions;
}

enum EventType {
  ORGANIZER = "EVENT_ORGANIZER",
  ARTIST = "EVENT_ARTIST",
  VENDOR = "EVENT_VENDOR",
  ADVERTISER = "EVENT_ADVERTISER",
}
registerEnumType(EventType, { name: "EventType" });
@InputType()
export class UploadBannerInput {
  @Field(() => EventType)
  type: EventType;

  @Field(() => [LinkMedia])
  @ValidateNested({ each: true })
  @Type(() => LinkMedia)
  assets: LinkMedia[];

  @Field(() => String)
  @IsObjectId({
    message: ERROR_MESSAGES.INVALID_EVENT_ID,
  })
  @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR })
  @Validate(HaveFrontAndBackSpaces, {
    message: ERROR_MESSAGES.EVENT_ID_TRAILING_SPACES_ERROR,
  })
  eventId: string;
}

@InputType()
export class GetBannerInput {
  @Field(() => EventType, { nullable: true })
  type?: EventType;

  @Field(() => String)
  @IsObjectId({
    message: ERROR_MESSAGES.INVALID_EVENT_ID,
  })
  @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR })
  @Validate(HaveFrontAndBackSpaces, {
    message: ERROR_MESSAGES.EVENT_ID_TRAILING_SPACES_ERROR,
  })
  eventId: string;
}

@InputType()
export class DeleteBannerInput {
  @Field(() => String)
  @IsObjectId({
    message: ERROR_MESSAGES.INVALID_EVENT_ID,
  })
  @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR })
  @Validate(HaveFrontAndBackSpaces, {
    message: ERROR_MESSAGES.EVENT_ID_TRAILING_SPACES_ERROR,
  })
  eventId: string;

  @Field(() => EventType)
  type?: EventType;

  @Field(() => String)
  @IsObjectId({
    message: ERROR_MESSAGES.INVALID_ID,
  })
  @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.EMPTY_ID_ERROR })
  @Validate(HaveFrontAndBackSpaces, {
    message: ERROR_MESSAGES.ID_TRAILING_SPACES,
  })
  id: string;
}
