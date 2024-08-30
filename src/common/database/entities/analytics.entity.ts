import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Analytics {
  @Prop(() => String)
  eventName: string;

  @Prop(() => String)
  eventId: string;

  @Prop({ type: Number, default: 0 })
  participants: number;

  @Prop({ type: Number, default: 0 })
  friends: number;

  @Prop({ type: Number, default: 0 })
  reactions: number;

  @Prop({ type: Number, default: 0 })
  chatParticipants: number;

  @Prop({ type: Number, default: 0 })
  productsAddedToCart: number;

  @Prop({ type: Number, default: 0 })
  avgTimeSpent: number;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({})
  createdAt: Date;

  @Prop({})
  updatedAt: Date;

  @Prop({})
  deletedAt: Date;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);
