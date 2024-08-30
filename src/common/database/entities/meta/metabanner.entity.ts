import { Field, ObjectType, registerEnumType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { SchemaType, Types } from "mongoose";
import { timeStamp } from "console";
import { Media, Timeslot, Transmute } from "./common.entitty";
import { Ownership } from "./ownership.entity";

enum bannerType {
  KIOSK = "KIOSK",
  STAGE = "STAGE",
}

registerEnumType(bannerType, {
  name: "bannerType",
});

@Schema()
@ObjectType()
export class MetaBanner {
  @Prop(() => String)
  name?: string;

  @Prop({ type: Types.ObjectId, ref: "Venue" })
  venue: string;

  @Prop(() => bannerType)
  type?: bannerType;

  @Prop(() => Transmute)
  transmute?: Transmute;

  @Prop({ type: Types.ObjectId, ref: "Ownership" })
  owner?: string;

  @Prop({ type: Types.ObjectId, ref: "Metabanners" })
  metaBanner?: string;
  

  @Prop(() => [Media])
  media?: Media[];

  @Prop(() => Number)
  interval?: number;

  @Prop(() => [Timeslot])
  slots?: Timeslot[];

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({})
  createdAt: Date;

  @Prop({})
  updatedAt: Date;
}

export const MetaBannerSchema = SchemaFactory.createForClass(MetaBanner);
