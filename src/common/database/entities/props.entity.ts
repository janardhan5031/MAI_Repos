import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Transmute } from "./meta/common.entitty";
import { Types } from "mongoose";

@Schema()
export class MetaProps {

  @Prop(() => String)
  name?: string;

  @Prop({ type: Types.ObjectId, ref: "Event" })
  event: string;

  @Prop(() => Transmute)
  transmute?: Transmute;

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