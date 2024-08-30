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
export class Artist {
  @Prop()
  email: string;

  @Prop()
  name: string;

  @Prop({default : null})
  preferredName: string;

  @Prop(() => String)
  countryCode: string;

  @Prop(() => Number)
  mobileNumber: number;

  @Prop({ type: String })
  organizer: string;

  @Prop()
  description: string;

  @Prop()
  @Field(() => [String])
  tags: string[];

  @Prop({ type: String })
  artistImage: string;

  @Prop({ type: Boolean, default: false })
  isEmailVerified: boolean;

  @Prop({ type: Boolean, default: false })
  isKYCVerified: boolean;

  @Prop({ type: String, default: KYC_STATUS.PENDING })
  kycStatus: string;

  @Prop({ type: SocialMedia })
  socialMedia: SocialMedia;

  @Prop()
  userId: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({})
  createdAt: Date;

  @Prop({})
  updatedAt: Date;

  @Prop({})
  deletedAt: Date;

  @Prop({ type: String })
  avatarGender: string;

  @Prop({ type: Boolean, default: false })
  isTermsAgreed: boolean;

  @Prop({ type: Boolean, default: false, required: false })
  isCustomAvatar: boolean;

  @Prop({ type: String })
  customAvatarUrl: string;
}

export const ArtistSchema = SchemaFactory.createForClass(Artist);
