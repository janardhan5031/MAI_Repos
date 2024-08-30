import { Field, InputType, registerEnumType } from "@nestjs/graphql";
import {
  IsAlpha,
  IsEmail,
  IsNotEmpty,
  IsUrl,
  Length,
  MaxLength,
  NotContains,
  Validate,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { ERROR_MESSAGES } from "src/common/config/constants";
import {
  HaveFrontAndBackSpaces,
  HaveMiddleSpaces,
  IsObjectId,
  IsValidEmail,
  RemoveWhiteSpaces,
  UniqueArrayConstraint,
} from "src/common/shared/inputValidator";
import { Type } from "class-transformer";

@InputType()
export class addArtistInput {
  @Field(() => String)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @IsAlpha()
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.FIRST_NAME_ERROR,
  })
  @Length(1, 32, { message: ERROR_MESSAGES.FIRST_NAME_CHARACTERS_ERROR })
  firstName: string;

  @Field(() => String)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @IsAlpha()
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.LAST_NAME_ERROR,
  })
  @Length(1, 32, { message: ERROR_MESSAGES.LAST_NAME_CHARACTERS_ERROR })
  lastName: string;

  @Field(() => String)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.PREFERRED_NAME_ERROR,
  })
  @Length(1, 32, { message: ERROR_MESSAGES.PREFERRED_NAME_LENGTH })
  preferredName: string;

  @Field(() => String)
  @IsEmail({}, { message: ERROR_MESSAGES.VALID_EMAIL_ERROR })
  @IsNotEmpty()
  @Validate(IsValidEmail, { message: ERROR_MESSAGES.VALID_EMAIL_ERROR })
  email: string;
}

@InputType()
export class setpasswordInput {
  @Field(() => String)
  @IsNotEmpty()
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.NEW_PASSWORD_ERROR,
  })
  @Validate(HaveMiddleSpaces, {
    message: ERROR_MESSAGES.NEW_PASSWORD_SPACE_ERROR,
  })
  @Length(8, 30, {
    message: ERROR_MESSAGES.NEW_PASSWORD_LENGTH_ERROR,
  })
  password: string;

  @Field(() => Boolean)
  @IsNotEmpty()
  isTermsAgreed: boolean;

  @Field(() => String)
  accessToken: string;
}
@InputType()
export class SocialMediaInput {
  @Field(() => String, { nullable: true })
  instaLink?: string;

  @Field(() => String, { nullable: true }) 
  facebookLink?: string;

  @Field(() => String, { nullable: true })
  twitterLink?: string;
}
@InputType()
export class onboardArtist {
  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => String, { nullable: true })
  @ValidateIf((obj, value) => value !== undefined && value !== null && value !== '')
  @MaxLength(32, { message: ERROR_MESSAGES.PREFERRED_NAME_LENGTH })
  preferredName: string;

  @Field(() => [String], { nullable: true })
  tags: string[];

  @Field(() => String, { nullable: true })
  artistImage: string;

  @Field(() => SocialMediaInput, { nullable: true })
  socialMedia: SocialMediaInput;
}

@InputType()
export class SetArtistPerformanceMode {

    @Field(() => Boolean)
    isMicEnabled: boolean;

    @Field(() => Boolean)
    isMusicEnabled: boolean;

    @Field(() => Boolean)
    isVideoEnabled: boolean;

    @Field(() => String,{nullable:true})
    @ValidateIf((obj, value) => value !== undefined && value !== null && value !== '')
    @IsUrl({}, { message: ERROR_MESSAGES.INVALID_URL })
    videoURL: string;

    @Field(() => String)
    @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR })
    @Validate(HaveFrontAndBackSpaces, {
      message: ERROR_MESSAGES.EVENT_ID_TRAILING_SPACES_ERROR,
    })
    eventId: string;
}


@InputType()
export class organizeArtistTracksInput {
  @Field(() => [String])
  @Validate(UniqueArrayConstraint, {
    message: ERROR_MESSAGES.TRACK_ID_ERROR,
  })
  trackIds: string[];

  @Field(() => String)
  @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR })
  @Validate(HaveFrontAndBackSpaces, {
    message: ERROR_MESSAGES.EVENT_ID_TRAILING_SPACES_ERROR,
  })
  eventId: string;
}
enum AudioMediaEnum {
  AUDIO = "AUDIO",
}
registerEnumType(AudioMediaEnum, { name: "AudioMediaEnum" });

@InputType()
export class LinkAudioTrack {
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

  @Field(() => AudioMediaEnum)
  type: AudioMediaEnum;

  @Field(() => Number, { nullable: true })
  duration: Number;
}


@InputType()
export class UploadArtistTracksInput {
  @Field(() => String)
  @IsObjectId({
    message: ERROR_MESSAGES.INVALID_EVENT_ID,
  })
  @Validate(RemoveWhiteSpaces, { message: ERROR_MESSAGES.EVENT_ID_EMPTY_ERROR })
  @Validate(HaveFrontAndBackSpaces, {
    message: ERROR_MESSAGES.EVENT_ID_TRAILING_SPACES_ERROR,
  })
  eventId: string;

  @Field(() => [LinkAudioTrack])
  @ValidateNested({ each: true })
  @Type(() => LinkAudioTrack)
  artistTrack: LinkAudioTrack[];
}


@InputType()
export class GetArtistTracksInput {
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



