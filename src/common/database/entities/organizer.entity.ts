import { Field, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { KYC_STATUS } from "src/common/config/constants";


@ObjectType()
export class SocialMedia {
  @Field(() => String, { nullable: true })
  instaLink?: string;

  @Field(() => String, { nullable: true })
  facebookLink?: string;

  @Field(() => String, { nullable: true })
  twitterLink?: string;
}
@Schema()
export class Organizer {
  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  name: string;

  @Prop()
  @Field(() => String)
  orgName: String;

  @Prop({ type: String })
  userId: string;

  @Prop({ type: String })
  orgId: string;

  @Prop(() => String)
  coverPhoto: string;

  @Prop(() => String)
  thumbnail: string;

  @Prop({ type: SocialMedia })
  socialMedia: SocialMedia;

  @Prop({ type: Number })
  mobileNumber: number;

  @Prop({ type: Boolean, default: false })
  isEmailVerified: boolean;

  @Prop({ type: Boolean, default: false })
  isKYCVerified: boolean;

  @Prop({ type: String, default: KYC_STATUS.PENDING })
  kycStatus: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;

  @Prop({ type: String })
  avatarGender: string;

  @Prop({ type: Boolean, default: false })
  isTermsAgreed: boolean;
}

export const OrganizerSchema = SchemaFactory.createForClass(Organizer);
