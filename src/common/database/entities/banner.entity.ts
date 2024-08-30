import { Field, ObjectType, registerEnumType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { SchemaType, Types } from "mongoose";
import { timeStamp } from "console";
import { Media, Timeslot, Transmute } from "./meta/common.entitty";
import { EVENT_STATUS } from "src/common/config/constants";

enum bannerType {
  KIOSK = "KIOSK",
  STAGE = "STAGE",
}

registerEnumType(bannerType, {
  name: "bannerType",
});

@Schema()
@ObjectType()
export class Banner {
  @Prop(() => String)
  name?: string;

  @Prop({ type: Types.ObjectId, ref: "Event" })
  event: string;

  @Prop(() => bannerType)
  type?: bannerType;

  @Prop(() => Transmute)
  transmute?: Transmute;

  @Prop({ type: Types.ObjectId, ref: "Ownership" })
  owner?: string;

  @Prop(() => [Media])
  media?: Media[];

  @Prop(() => Number)
  interval?: number;

  @Prop(() => [Timeslot])
  slots?: Timeslot[];

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({ default: new Date() })
  createdAt: Date;

  @Prop({})
  deletedAt: Date;

  @Prop({})
  updatedAt: Date;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
