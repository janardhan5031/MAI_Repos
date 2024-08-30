import { Field } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Artist } from "./artist.entity";
import { Event } from "./events.entity.js";

@Schema()
export class Ticket {
  @Prop()
  @Field(() => Number)
  price: number;

  @Prop()
  @Field(() => Number)
  numberTicketsCreated: number;

  @Prop({ default: 0 })
  @Field(() => Number)
  numberTicketsSold: number;

  @Prop()
  @Field(() => Date)
  saleStartDate: Date;

  @Prop()
  @Field(() => String)
  saleStartTime: string;

  @Prop()
  @Field(() => Date)
  saleEndDate: Date;

  @Prop()
  @Field(() => String)
  saleEndTime: string;

  @Prop({ required: true, default: false })
  @Field(() => Boolean)
  isDeleted: Boolean;

  @Prop({ type: Types.ObjectId, ref: "Event" })
  @Field(() => Event)
  event: Event;

  @Prop({
    default: new Date(),
  })
  @Field(() => Date)
  createdAt: Date;

  @Prop({
    default: new Date(),
  })
  @Field(() => Date)
  updatedAt: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
