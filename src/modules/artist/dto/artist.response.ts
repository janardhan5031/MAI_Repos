import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from "@nestjs/graphql";
import { Type } from "class-transformer";
import { IsUrl, Validate, ValidateNested } from "class-validator";
import { ERROR_MESSAGES } from "src/common/config/constants";
import { SocialMedia } from "src/common/database/entities/artist.entity";
import {
  HaveFrontAndBackSpaces,
  IsObjectId,
  RemoveWhiteSpaces,
  UniqueArrayConstraint,
} from "src/common/shared/inputValidator";
import { AudioLinkMedia } from "src/modules/venue/dto/venue.response";
@ObjectType()
export class ArtistDetailsResponse {
  @Field(() => String, { nullable: true })
  ArtistId?: string;

  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => Boolean, { nullable: true })
  isKYCVerified: boolean;

  @Field(() => String, { nullable: true })
  kycStatus: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  preferredName?: string;

  @Field(() => String, { nullable: true })
  lastName?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  userId: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => String, { nullable: true })
  artistImage?: string;

  @Field(() => SocialMedia, { nullable: true })
  socialMedia?: SocialMedia;

  @Field(() => Boolean, { nullable: true })
  isCustomAvatar: boolean;

  @Field(() => String, { nullable: true })
  customAvatarUrl: string;
}

@ObjectType()
export class data {
  @Field(() => ArtistDetailsResponse)
  artist?: ArtistDetailsResponse;
}
@ObjectType()
export class OnboardArtistResponse {
  @Field(() => String, { nullable: true })
  message: string;

  @Field(() => String)
  userId: string;

  @Field(() => String, { nullable: true })
  verifyIdentifier: string;
}

@ObjectType()
export class setPasswordResponse {
  @Field(() => String, { nullable: true })
  message: string;

  @Field(() => Boolean)
  isOk: boolean;

  @Field(() => ArtistDetailsResponse, { nullable: true })
  data: ArtistDetailsResponse;
}
@ObjectType()
export class ArtistsResponse {
  @Field(() => [ArtistDetailsResponse])
  data: ArtistDetailsResponse[];

  @Field(() => Number, { nullable: true })
  total: number;

  @Field(() => Number, { nullable: true })
  filtered: number;
}

@ObjectType()
export class GetArtistTrackResponse {
  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => [AudioLinkMedia], { nullable: true })
  artistTrack?: AudioLinkMedia[];
}

@ObjectType()
export class GetArtistPerformanceMode {
  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => Boolean)
  isMicEnabled: boolean;

  @Field(() => Boolean)
  isMusicEnabled: boolean;

  @Field(() => Boolean,)
  isVideoEnabled: boolean;

  @Field(() => String,{nullable:true})
  videoURL: string;

  @Field(() => [AudioLinkMedia])
  artistTrack: AudioLinkMedia[];
}

@ObjectType()
export class SetArtistPerformance {
  @Field(() => String)
  _id?: string;

  @Field(() => String)
  name?: string;

  @Field(() => Boolean)
  isMicEnabled: boolean;

  @Field(() => Boolean)
  isMusicEnabled: boolean;

  @Field(() => Boolean,)
  isVideoEnabled: boolean;

  @Field(() => String,{nullable:true})
  videoURL: string;
}
