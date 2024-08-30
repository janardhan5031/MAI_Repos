import { ObjectType, registerEnumType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
enum mediaType {
  VIDEO = "VIDEO",
  IMAGE = "IMAGE",
  AUDIO = "AUDIO",
}
enum mediaFormat {
  wav = "wav",
  ogg = "ogg",
  mp3 = "mp3",
  mp4 = "mp4",
  jpeg = "jpeg",
  png = "png",
  jpg = "jpg",
}
registerEnumType(mediaType, {
  name: "mediaType",
});

class Point {
  @Prop(() => Number)
  x: number;

  @Prop(() => Number)
  y: number;
}

class Media {
  @Prop(() => mediaType)
  type: mediaType;

  @Prop(() => String)
  fileName: string;

  @Prop(() => String)
  link: string;

  @Prop(() => mediaFormat)
  format: mediaFormat;

  @Prop(() => Point)
  dimension: Point;

  @Prop(() => String)
  thumbnail: string;
}

@Schema()
export class Gallery {
  @Prop({ type: Types.ObjectId, ref: "Event" })
  event: string;

  @Prop({ type: Types.ObjectId })
  user?: string;

  @Prop(() => [Media])
  media?: Media[];
}

export const GallerySchema = SchemaFactory.createForClass(Gallery);
