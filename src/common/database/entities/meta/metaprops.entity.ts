import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Transmute } from "./common.entitty";
import { Types } from "mongoose";

@Schema()
export class MetaProps {

  @Prop(() => String)
  name?: string;

  @Prop(() => Transmute)
  transmute?: Transmute;

  @Prop({ type: Types.ObjectId, ref: "Venue" })
  venue: string;

  @Prop(() => String)
  mediaLink?: string;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({ default: new Date() })
  createdAt: Date;

  @Prop({ default: new Date() })
  updatedAt: Date;
}

export const MetaPropsSchema = SchemaFactory.createForClass(MetaProps);