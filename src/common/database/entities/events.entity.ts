import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { EventStatus, Initialstatus } from "src/common/config/constants";

@ObjectType()
class csvObject {
  @Field( {nullable: true})
  csvLink?: string;

  @Field( {nullable: true})
  csvFileName?: string;

  @Field( {nullable: true})
  csvRows?: string;
}
@Schema()
export class Event {
  @Prop(() => String)
  eventName: string;

  @Prop(() => String)
  description: string;

  @Prop(() => String)
  transactionId: string;

  @Prop(() => [String])
  tags: string[];

  @Prop({ required: true, default: false })
  isAgeRestricted: boolean;

  @Prop({ type: Boolean, default: false })
  isKycMandatory: boolean;

  @Prop({ type: Boolean, default: false })
  isPrivate: boolean;

  @Prop(() => Number)
  ageLimit: number;

  @Prop(() => [String])
  assets: string[];

  @Prop(() => Number)
  ticketCount: number;

  @Prop(() => Number)
  ticketsLeft: number;

  @Prop(() => Number)
  ticketPrice: number;

  @Prop({ type: String, default: null })
  eventStatus: EventStatus;

  @Prop(() => String)
  coverPhoto: string;

  @Prop(() => String)
  thumbnail: string;

  @Prop({ default: Initialstatus.NEW })
  status: Initialstatus;

  @Prop({ type: [String], default: [] })
  progress: string[];

  @Prop(() => Date)
  startDate: Date;

  @Prop(() => Date)
  endDate: Date;

  @Prop(() => Date)
  saleStartDate: Date;

  @Prop(() => Date)
  saleEndDate: Date;

  @Prop(() => String)
  startTime: string;

  @Prop(() => String)
  endTime: string;

  @Prop(() => Number)
  duration: number;

  @Prop(() => Number)
  price: number;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop()
  isFreeEntry: boolean;

  @Prop({ type: Types.ObjectId, ref: "Languages" })
  languages: string[];

  @Prop({ type: Types.ObjectId, ref: "Slots" })
  slots: string[];

  @Prop({ type: Types.ObjectId, ref: "Venue" })
  venue: string;

  @Prop({ type: Types.ObjectId, ref: "EventCategory" })
  category: string;

  @Prop({ type: Types.ObjectId, ref: "Organizer" })
  organizer: String;

  @Prop({})
  createdAt: Date;

  @Prop({})
  updatedAt: Date;

  @Prop({})
  deletedAt: Date;

  @Prop({ type: csvObject })
  csv: csvObject
}

export const EventSchema = SchemaFactory.createForClass(Event);
