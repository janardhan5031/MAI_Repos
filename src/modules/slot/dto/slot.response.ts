import { Field, ObjectType } from "@nestjs/graphql";
import { DateTime } from "aws-sdk/clients/devicefarm";
import { ArtistDetailsResponse } from "src/modules/artist/dto/artist.response";

@ObjectType()
export class GetSlotResponse {
  @Field(() => Date)
  startDate: Date;

  @Field(() => Date)
  endDate: Date;

  @Field(() => Number)
  duration: number;

  @Field(() => String)
  artistId: string;

  @Field(() => String)
  eventId: string;

  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  isDeleted: Boolean;

}

@ObjectType()
export class GetSlotResponsewithartist {
  @Field(() => Date)
  startDate: Date;

  @Field(() => Date,{nullable  : true})
  endDate: Date;

  @Field(() => Number)
  duration: number;

  @Field(() => ArtistDetailsResponse)
  artistId: ArtistDetailsResponse;

  @Field(() => String)
  eventId: string;

  @Field(() => String)
  _id: string;

  @Field(() => Boolean)
  isDeleted: Boolean;

}


@ObjectType()
export class SlotsResponse {
  @Field(() => Date)
  startDate: Date;

  @Field(() => String)
  slotTime: String;

  @Field(() => Number)
  duration: number;

  @Field(() => String)
  artist: string;

  @Field(() => String)
  evnetId: string;

  @Field(() => Boolean)
  isDeleted: Boolean;

}

@ObjectType()
export class GetOrgEventSlots {
  @Field(() => [GetSlotResponse])
  slotsList: GetSlotResponse[];

  @Field(() => Number)
  totalSlots: number;
}

@ObjectType()
export class GetSlotDates {
  @Field(() => [Date])
  dates: DateTime[];
}

@ObjectType()
export class GetSlotTime {
  @Field(() => [String],{nullable : true})
  time: string[];

}

@ObjectType()
export class GetSlotDuration {
  @Field(() => [String])
  duration: string[];
}

@ObjectType()
export class slotResponse {
  @Field(() => Boolean, { nullable: true })
  isOk: boolean;

  @Field(() => String, { nullable: true })
  message: string;

  @Field(() => GetSlotResponse,{ nullable: true })
  data:GetSlotResponse; 
}

@ObjectType()
export class allslotsResponse {
  @Field(() => Number, { nullable: true })
  total: number;

  @Field(() => Number, { nullable: true })
  filtered: number;

  @Field(() => [GetSlotResponse], { nullable: true })
  data: [GetSlotResponse]; 
}