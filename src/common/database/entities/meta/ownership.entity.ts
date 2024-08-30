import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { registerEnumType } from "@nestjs/graphql";
import mongoose, { Types } from "mongoose";
import { AudioMedia, Media, Timeslot } from "./common.entitty";

enum OwnerType {
  ARTIST = "EVENT_ARTIST",
  ADVERTISER = "EVENT_ADVERTISER",
  ORGANIZER = "EVENT_ORGANIZER",
  VENDOR = "EVENT_VENDOR",
}

registerEnumType(OwnerType, {
  name: "OwnerType",
});

export class CustomAvatar {
  @Prop(() => String)
  Url: string;

  @Prop(() => Boolean)
  isCustomAvatar: boolean;
}

@Schema()
export class Ownership {
  @Prop(() => String)
  name?: string;

  @Prop(() => String)
  eventName?: string;

  @Prop({ type: Types.ObjectId, refPath: "events" })
  event?: string;

  @Prop(() => OwnerType)
  type?: OwnerType;

  @Prop({ type: Types.ObjectId, ref: "type" }) // Assuming User is the collection where ownerId references
  ownerId?: string;

  @Prop(() => [Media])
  assets?: Media[];

  @Prop({ type: [String], default: [] })
  progress?: string[];

  @Prop({ type: [String], default: [] })
  orgProgress?: string[];

  @Prop(() => [Media])
  ownerAssets?: Media[];

  @Prop(() => [AudioMedia])
  artistTrack?: AudioMedia[];

  @Prop(() => [Timeslot])
  timeSlot?: Timeslot[];

  @Prop({ required: true, default: { Url: null, isCustomAvatar: false } })
  customAvatar: CustomAvatar;

  @Prop({ required: true, default: false })
  isMicEnabled: boolean;

  @Prop({ required: true, default: false })
  isMusicEnabled: boolean;

  @Prop({ required: true, default: false })
  isVideoEnabled: boolean;

  @Prop(() => String)
  videoURL?: string;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const ownershipSchema = SchemaFactory.createForClass(Ownership);
