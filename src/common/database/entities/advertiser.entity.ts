import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { KYC_STATUS } from "src/common/config/constants";

@ObjectType()
export class Events {
  @Field(() => String, { nullable: true })
  eventId?: string;

  @Field(() => String, { nullable: true })
  status?: string;

  @Field(() => String, { nullable: true })
  eventName?: string;
}

@Schema()
export class Advertiser {
  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  orgName: string;

  @Prop({ type: String })
  countryCode: string;

  @Prop({ type: String })
  userId: string;

  @Prop({ type: String })
  organizer: string;

  @Prop({ type: String, default: KYC_STATUS.PENDING })
  kycStatus: string;

  @Prop({ type: String })
  orgId: string;

  @Prop({ type: Number })
  mobileNumber: number;

  @Prop({ type: Boolean, default: false })
  isEmailVerified: boolean;

  @Prop({ type: Boolean, default: false })
  isKYCVerified: boolean;

  @Prop({ type: Events })
  events: Events;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({})
  deletedAt: Date;

  @Prop({ type: String })
  avatarGender: string;

  @Prop({ type: Boolean, default: false })
  isTermsAgreed: boolean;
}

export const AdvertiserSchema = SchemaFactory.createForClass(Advertiser);
