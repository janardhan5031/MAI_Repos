import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { DEBATE_STATUS } from 'src/common/config/constants';

@ObjectType()
class Option {
  @Field()
  option: string;

  @Field()
  votes: number;
}

@ObjectType()
class UserResponse {
  @Field()
  userId: string;

  @Field()
  selectedOption: string;
}

@ObjectType()
@Schema({ versionKey: false })
export class EventDebatePolls {
  @Field()
  @Prop({ required: true })
  question: string;

  @Field(() => [Option])
  @Prop({ type: [Option], default: [] })
  options: Option[];

  @Field()
  @Prop({ enum: DEBATE_STATUS, default: DEBATE_STATUS.DRAFT })
  status: string;

  @Field(() => String)
  @Prop({ type: Types.ObjectId, ref: "Event" })
  eventId: Types.ObjectId;

  @Field(() => [UserResponse])
  @Prop({ type: [UserResponse], default: [] })
  responses: UserResponse[];

  @Field(() => Date)
  @Prop({ default: Date.now })
  createdAt: Date;

  @Field(() => Date)
  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const EventDebatePollsModelSchema = SchemaFactory.createForClass(EventDebatePolls);
