import { Field } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";
import { Organizer } from "src/common/database/entities/organizer.entity";
import { timeStamp } from "console";
import { MetaBanner } from "./metabanner.entity";
import { Transmute } from "./common.entitty";
import { Ownership } from "./ownership.entity";

@Schema()
export class MetaKiosk {
  @Prop(() => String)
  name?: string;

  @Prop(() => Transmute)
  transmute?: Transmute;

  @Prop({ type: Types.ObjectId, ref: "MetaBanner" })
  banners?: string[];

  @Prop({ type: Types.ObjectId, ref: "Venue" })
  venue: string;

  @Prop({ type: Types.ObjectId, ref: "Ownership" })
  owner?: string;

  @Prop({type: Types.ObjectId})
  products?: string[];

  @Prop(() => String)
  thumbnailUrl?: string;

  @Prop(() => String)
  dimensions?: string;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({})
  createdAt: Date;

  @Prop({})
  updatedAt: Date;
}

export const MetaKioskSchema = SchemaFactory.createForClass(MetaKiosk);
