import { Field, ObjectType } from "@nestjs/graphql";
import { EventStatus } from "src/common/config/constants";
import { SocialMedia } from "src/common/database/entities/artist.entity";
import { MediaResponse, PointResponse } from "src/modules/gallery/Dto/gallery.response";

@ObjectType()
export class eventList {

  @Field(() => String)
  _id: String

  @Field(() => String, { nullable: true })
  eventName?: string;

  @Field(() => String, { nullable: true })
  venue?: string;

  @Field(() => Date, { nullable: true })
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;

  @Field(() => String, { nullable: true })
  startTime?: string;

  @Field(() => String, { nullable: true })
  endTime?: string;

  @Field(() => Number, { nullable: true })
  ticketPrice?: number;

  @Field(() => String, { nullable: true })
  thumbnail?: string;

  @Field(() => String, { nullable: true })
  coverPhoto?: string;

  @Field(() => String, { nullable: true })
  eventStatus?: string
}

@ObjectType()
export class previousEventsList {
  @Field(() => String)
  _id: String

  @Field(() => String, { nullable: true })
  eventName?: string;

  @Field(() => String, { nullable: true })
  venue?: string;

  @Field(() => Date, { nullable: true })
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;

  @Field(() => String, { nullable: true })
  thumbnail?: string;

  @Field(() => String, { nullable: true })
  coverPhoto?: string;

}
@ObjectType()
export class PreviousEventsResponse {
  @Field(() => Number, { nullable: true })
  totalEvents?: number;

  @Field(() => [previousEventsList], { nullable: true })
  eventsList?: previousEventsList[];
}

@ObjectType()
export class SearchEventResponse {
  @Field(() => Number, { nullable: true })
  totalEvents?: number;

  @Field(() => [eventList], { nullable: true })
  eventsList?: eventList[];
}

@ObjectType()
export class OrganizerProfileDetails {
  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  orgName?: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  coverPhoto?: string;

  @Field(() => String, { nullable: true })
  thumbnail?: string;

  @Field(() => Number, { nullable: true })
  totalEvents?: number;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => SocialMedia, { nullable: true })
  socialMedia?: SocialMedia;

}

@ObjectType()
export class Artist {
  @Field(() => String, { nullable: true })
  _id: string;
  @Field(() => [String], { nullable: true })
  tags: string[];
  @Field(() => String, { nullable: true })
  artistImage: string;
  @Field(() => String, { nullable: true })
  name: string;
}

@ObjectType()
export class LatestArtistsDTO {
  @Field(() => [Artist], { nullable: true })
  Artists: Artist[];
}


@ObjectType()
export class organizerFavourites {
  @Field(() => String, { nullable: true })
  _id: string;
  @Field(() => Date, { nullable: true })
  startDate: Date;

  @Field(() => String, { nullable: true })
  eventName: string; @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => String, { nullable: true })
  fileName?: string;

  @Field(() => String, { nullable: true })
  link?: string;

  @Field(() => String, { nullable: true })
  format?: string;

  @Field(() => PointResponse, { nullable: true })
  dimension?: PointResponse;

  @Field(() => String, { nullable: true })
  thumbnail?: string;
}