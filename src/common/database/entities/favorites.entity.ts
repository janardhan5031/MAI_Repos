import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema()
export class Favorite {
  @Prop({ type: Types.ObjectId, ref: "Event" })
  event: string;

  @Prop({ type: Types.ObjectId })
  userId?: string;

  @Prop(() => [Types.ObjectId])
  media: Types.ObjectId[];
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
