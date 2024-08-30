import { Field, registerEnumType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Range, Spawn, Vector } from "./common.entitty";

enum venueType {
  INDOOR = "INDOOR",
  OUTDOOR = "OUTDOOR",
  AUDITORIUM = "AUDITORIUM",
}

registerEnumType(venueType, {
  name: "venueType",
});
@Schema()
export class Venue {
  @Prop(() => String)
  name?: string;

  @Prop(() => String)
  address?: string;

  @Prop(() => Vector)
  location?: Vector;

  @Prop(() => String)
  SceneName?: string;

  @Prop(() => String)
  venueImage?: string;

  @Prop(() => Range)
  userCount?: Range;

  @Prop({ type: Types.ObjectId, ref: "MetaProps" })
  props?: string[];

  @Prop({ type: Types.ObjectId, ref: "MetaKiosks" })
  kiosks?: string[];

  @Prop({ type: Types.ObjectId, ref: "MetaBanners" })
  banners?: string[];

  @Prop(() => Spawn)
  spawnPoints?: Spawn;

  @Prop(() => Number)
  bannersCount?: number;

  @Prop(() => Number)
  KioskCount: number;

  @Prop(() => Number)
  propCount?: number;

  @Prop(() => venueType)
  venueType?: venueType;

  @Prop(() => Number)
  venuePrice?: number;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({})
  createdAt: Date;

  @Prop({})
  updatedAt: Date;

  @Prop({})
  deletedAt: Date;

}

export const VenueSchema = SchemaFactory.createForClass(Venue);
