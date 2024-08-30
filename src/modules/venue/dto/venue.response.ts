import { Field, ObjectType } from "@nestjs/graphql";
import { Prop } from "@nestjs/mongoose";
import JSON from "graphql-type-json";
@ObjectType()
class Position {
  @Field()
  x: number;

  @Field()
  y: number;

  @Field()
  z: number;
}

@ObjectType()
export class UploadBannerResponse {
  @Field(() => Boolean, { nullable: true })
  isOk?: boolean;

  @Field(() => String, { nullable: true })
  message?: string;
}
@ObjectType()
export class GetVenuesResponse {
  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  venueImage?: string;

  @Field(() => Number, { nullable: true })
  venuePriceperHour?: number;

  @Field(() => Boolean, { nullable: true })
  isSold?: boolean;

  @Field(() => Number, { nullable: true })
  userCount?: number;

  @Field(() => Number, { nullable: true })
  seats?: number;

  @Field(() => Number, { nullable: true })
  stages?: number;

  @Field(() => String, { nullable: true })
  venueType?: string;

  @Field(() => Number, { nullable: true })
  bannersCount?: number;

  @Field(() => Number, { nullable: true })
  kioskCount?: number;

  @Field(() => Number, { nullable: true })
  propCount?: number;

  @Field(() => String, { nullable: true })
  address?: string;

  @Field(() => Number, { nullable: true })
  venuePrice?: number;

  @Field(() => Position, { nullable: true })
  location?: Position;
}

@ObjectType()
export class referenceDetails {
  @Field(() => String)
  referenceNumber: string;

  @Field(() => Number)
  price: number;

  @Field(() => String)
  eventId: string;
}

@ObjectType()
export class VenueResponseData {
  @Field(() => [GetVenuesResponse], { nullable: true })
  data: GetVenuesResponse[];

  @Field(() => Number)
  filtered: number;

  @Field(() => Number)
  total: number;
}

@ObjectType()
export class VenueResponse {
  @Field(() => String)
  eventId: string;

  @Field(() => String)
  status: string;

  @Field(() => String)
  message: string;
}

@ObjectType()
class Rotation {
  @Field()
  x: number;

  @Field()
  y: number;

  @Field()
  z: number;
}

@ObjectType()
class Scale {
  @Field()
  x: number;

  @Field()
  y: number;

  @Field()
  z: number;
}

@ObjectType()
export class Transform {
  @Field(() => Position)
  position: Position;

  @Field(() => Rotation)
  rotation: Rotation;

  @Field(() => Scale)
  scale: Scale;
}

@ObjectType()
export class GetPropsResponse {
  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  mediaLink?: string;

  @Field(() => Transform, { nullable: true })
  transform?: Transform;
}
@ObjectType()
class MediaType {
  @Field(() => String, { nullable: true })
  _id?: string;
  @Field(() => String, { nullable: true })
  url?: string;
}
////////////////////////////////////

////////////////////////////////////////
@ObjectType()
export class Dimension {
  @Field(() => Number)
  x: number;

  @Field(() => Number)
  y: number;
}
@ObjectType()
export class Linkmedia {
  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => String, { nullable: true })
  link?: string;

  @Field(() => String, { nullable: true })
  fileName?: string;

  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => Dimension, { nullable: true })
  dimensions?: Dimension;
}

@ObjectType()
export class GetBannerResponse {
  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  event?: string;

  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => String, { nullable: true })
  ownerId?: string;

  @Field(() => [Linkmedia], { nullable: true })
  assets?: Linkmedia[];

  @Field(() => [Linkmedia], { nullable: true })
  ownerAssets?: Linkmedia[];
}
@ObjectType()
export class GetLatestDatesResponse {
  @Field(() => String)
  startTime: string;

  @Field(() => String)
  endTime: string;

  @Field(() => String)
  startDate: string;

  @Field(() => String)
  endDate: string;
}

@ObjectType()
export class AudioLinkMedia {
  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => String, { nullable: true })
  link?: string;

  @Field(() => String, { nullable: true })
  fileName?: string;

  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => Number, { nullable: true })
  duration?: Number;

  @Field(() => Number, { nullable: true })
  rank?: Number;
}
@ObjectType()
export class GetBannerDetailResponse {
  @Field(() => [GetBannerResponse], { nullable: true })
  getBanners?: GetBannerResponse[];

  @Field(() => Boolean, { nullable: true })
  isMeidaExists?: boolean;
}
