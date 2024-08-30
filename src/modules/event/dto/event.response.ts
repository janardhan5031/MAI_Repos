import { Field, ObjectType } from "@nestjs/graphql";
import { GetSlotResponsewithartist } from "src/modules/slot/dto/slot.response";
import { GetVenuesResponse } from "src/modules/venue/dto/venue.response";

import JSON from "graphql-type-json";
import { AdvertiserResponse } from "src/modules/advertiser/dto/advrtiser.response";


@ObjectType()
export class timeSlot {
  @Field(() => Date)
  startTime: Date;

  @Field(() => Date)
  endTime: Date;
}
@ObjectType()
export class GetEventDetailsResponse {
  @Field(() => String)
  _id: string;

  @Field(() => String, { nullable: true })
  eventName?: string;

  @Field(() => [GetSlotResponsewithartist], { nullable: true })
  slots?: [GetSlotResponsewithartist];

  @Field(() => String, { nullable: true })
  thumbnail?: string;

  @Field(() => String, { nullable: true })
  coverPhoto?: string;

  @Field(() => String)
  description?: string;

  @Field(() => Boolean)
  isAgeRestricted?: boolean;

  @Field(() => Boolean)
  isPrivate?: boolean;

  @Field(() => Boolean, { nullable: true })
  isKycMandatory?: boolean;

  @Field(() => Number, { nullable: true })
  ageLimit?: number;

  @Field(() => [JSON], { nullable: true })
  languages?: JSON[];

  @Field(() => [String], { nullable: true })
  languages_name?: string[];

  @Field(() => String, { nullable: true })
  category_name?: string;

  @Field(() => Boolean, { nullable: true })
  isFreeEntry?: boolean;

  @Field(() => [String])
  tags?: string[];

  @Field(() => JSON)
  category?: JSON;

  @Field(() => GetVenuesResponse, { nullable: true })
  venue?: GetVenuesResponse;

  @Field(() => Date, { nullable: true })
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;

  @Field(() => Date, { nullable: true })
  endTimeDate?: Date;

  @Field(() => Number, { nullable: true })
  duration?: number;

  @Field(() => Number, { nullable: true })
  ticketCount: number;

  @Field(() => Number, { nullable: true })
  ticketsLeft: number;

  @Field(() => String, { nullable: true })
  eventStatus?: string;

  @Field(() => Number, { nullable: true })
  ticketPrice: number;

  @Field(() => String, { nullable: true })
  status?: string;

  @Field(() => [String], { nullable: true, defaultValue: [] })
  progress?: string[];

  @Field(() => [AdvertiserResponse], { nullable: true })
  advertisers?: AdvertiserResponse[];

  @Field(() => [JSON], { nullable: true })
  vendors?: JSON[];

  @Field(() => [timeSlot], { nullable: true })
  timeSlots?: timeSlot[];

  @Field(() => Number, { nullable: true })
  bannersCount?: number;
}

@ObjectType()
class category {
  @Field(() => String, { nullable: true })
  eventCategory: string;

  @Field(() => String, { nullable: true })
  role: string;


  @Field(() => String, { nullable: true })
  _id: string;
}


@ObjectType()
export class filteredTimeSlot {

  @Field(() => Date, { nullable: true })
  startTime: Date;

  @Field(() => Date, { nullable: true })
  endTime: Date;
}

@ObjectType()
export class CustomAvatarResponse {
  @Field(() => String, { nullable: true })
  Url: string;

  @Field(() => Boolean, { nullable: true })
  isCustomAvatar: boolean;
}
@ObjectType()
export class GetAllEvents {
  @Field(() => String, { nullable: true })
  eventName: string;

  @Field(() => GetVenuesResponse, { nullable: true })
  venue?: GetVenuesResponse;

  @Field(() => Number, { nullable: true })
  artists: number;

  @Field(() => Date, { nullable: true })
  startDate: Date;

  @Field(() => Date, { nullable: true })
  endDate: Date;

  @Field(() => Date, { nullable: true })
  endTimeDate: Date;

  @Field(() => Number, { nullable: true })
  ticketCount: number;

  @Field(() => Number, { nullable: true })
  bannersCount: number;

  @Field(() => Number, { nullable: true })
  ticketsLeft: number;

  @Field(() => Boolean, { nullable: true })
  isFreeEntry?: boolean;

  @Field(() => String, { nullable: true })
  coverPhoto: string;

  @Field(() => String, { nullable: true })
  thumbnail: string;

  @Field(() => String, { nullable: true })
  status: string;

  @Field(() => filteredTimeSlot, { nullable: true })
  filteredTimeSlot: filteredTimeSlot;


  @Field(() => CustomAvatarResponse, { nullable: true })
  customAvatar: CustomAvatarResponse;

  @Field(() => String, { nullable: true })
  eventStatus: string;

  @Field(() => Boolean, { nullable: true })
  isDeleted: boolean;

  @Field(() => category, { nullable: true })
  category: category

  @Field(() => String)
  _id: string;
}

@ObjectType()
export class GetAllEventResponse {
  @Field(() => [GetAllEvents])
  data: [GetAllEvents];

  @Field(() => Number, { nullable: true })
  total: number;

  @Field(() => Number, { nullable: true })
  filtered: number;
}


@ObjectType()
export class updateEventResponse {
  @Field(() => String, { nullable: true })
  status: string;

  @Field(() => String, { nullable: true })
  _id: string;

  @Field(() => [String], { nullable: true })
  progress: string[];

  @Field(() => Boolean, { nullable: true })
  isOk: boolean;

  @Field(() => String, { nullable: true })
  message: string;
}

@ObjectType()
export class GetEventIdResponse {
  @Field(() => String, { nullable: true })
  eventId: string;
}

@ObjectType()
export class CancelEventResponse extends GetEventIdResponse {
  @Field(() => Boolean, { nullable: true })
  isOk: boolean;

  @Field(() => String, { nullable: true })
  message: string;

  @Field(() => String, { nullable: true })
  eventId: string;
}

@ObjectType()
export class GetProgressResponse {
  @Field(() => [String], { nullable: true })
  progress: string[];

  @Field(() => [String], { nullable: true })
  orgProgress: string[];
}
