import { Field } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Artist } from "./artist.entity";
import { Event } from "./events.entity.js";

@Schema()
export class Slot {
  @Prop()
  @Field(() => Date)
  startDate: Date;

  @Prop()
  @Field(() => Date)
  endDate: Date;

  @Prop()
  @Field(() => String)
  slotTime: string;

  @Prop()
  @Field(() => String)
  endTime: string;

  @Prop()
  @Field(() => Number)
  duration: number;


  @Prop()
  @Field(() => [Number])
  timeArray: number[];

  @Prop({ required: true, default: false })
  @Field(() => Boolean)
  isDeleted: Boolean;

  @Prop({ type: Types.ObjectId, ref: "Artist" })
  @Field(() => String)
  artistId: string;

  @Prop({ type: Types.ObjectId, ref: "Event" })
  @Field(() => String)
  eventId: string;

  @Prop({})
  @Field(() => Date)
  createdAt: Date;

  @Prop({})
  @Field(() => Date)
  updatedAt: Date;

  @Prop({})
  @Field(() => Date)
  deletedAt: Date;
}

export const SlotSchema = SchemaFactory.createForClass(Slot);
