import { ObjectType, registerEnumType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Types } from "mongoose";
import { timeStamp } from "console";

export class Spawn {
  @Prop(() => String)
  type?: string;

  @Prop(() => [Point])
  points?: Point[];
}

export class Timeslot {
  @Prop(() => Date)
  startTime: Date;

  @Prop(() => Date)
  endTime: Date;
}

export class Vector {
  @Prop(() => Number)
  x: number;

  @Prop(() => Number)
  y: number;

  @Prop(() => Number)
  z: number;
}

export class Point {
  @Prop(() => Number)
  x: number;

  @Prop(() => Number)
  y: number;
}

export class Range {
  @Prop(() => Number)
  min: number;

  @Prop(() => Number)
  max: number;
}

export class Transmute {
  @Prop(() => Vector)
  rotation: Vector;

  @Prop(() => Vector)
  position: Vector;

  @Prop(() => Vector)
  scale: Vector;
}

enum mediaType {
  VIDEO = "VIDEO",
  IMAGE = "IMAGE",
}

registerEnumType(mediaType, {
  name: "mediaType",
});

export class Media {
  @Prop(() => mediaType)
  type: mediaType;

  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop(() => String)
  fileName: string;

  @Prop(() => String)
  link: string;

  @Prop(() => String)
  thumbnail: string;

  @Prop(() => Point)
  dimension: Point;
}

enum AudioMediaType {
  AUDIO = 'AUDIO'
}

export class AudioMedia {
  @Prop(() => AudioMediaType)
  type: AudioMediaType;

  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop(() => String)
  fileName: string;

  @Prop(() => String)
  link: string;

  @Prop(() => Number)
  duration: Number;

  @Prop(() => Number)
  rank: Number;
}
