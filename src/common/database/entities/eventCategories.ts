import { Field } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class EventCategory {
  @Prop()
  eventCategory: string;

  @Prop()
  isNpcEnabled: boolean;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({
    default: new Date(),
  })
  createdAt: Date;

  @Prop({
    default: new Date(),
  })
  updatedAt: Date;
}

export const EventCategorySchema = SchemaFactory.createForClass(EventCategory);
