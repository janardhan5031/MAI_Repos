import { Field, ObjectType } from "@nestjs/graphql";
@ObjectType()
export class Address {
  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => String, { nullable: true })
  address: string;

  @Field(() => String, { nullable: true })
  city: string;

  @Field(() => String, { nullable: true })
  state: string;

  @Field(() => String, { nullable: true })
  country: string;

  @Field(() => String, { nullable: true })
  zipcode: string;
}

@ObjectType()
export class profileAssets {
  @Field(() => String, { nullable: true })
  thumbnail_url: string;

  @Field(() => String, { nullable: true })
  avatar_url: string;
}

@ObjectType()
export class SocialMediaResponse {
  @Field(() => String, { nullable: true })
  instaLink?: string;

  @Field(() => String, { nullable: true })
  facebookLink?: string;

  @Field(() => String, { nullable: true })
  twitterLink?: string;

}

@ObjectType()
export class LoginResponse {
  @Field(() => String, { nullable: true })
  access_token?: string;

  @Field(() => String, { nullable: true })
  refresh_token?: string;

  @Field(() => String, { nullable: true })
  session_id?: string;

  @Field(() => String, { nullable: true })
  profile_image?: string;

  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => Address, { nullable: true })
  address?: Address;

  @Field(() => String, { nullable: true })
  first_name?: string;

  @Field(() => String, { nullable: true })
  last_name?: string;

  @Field(() => String, { nullable: true })
  kycStatus?: string;

  @Field(() => String, { nullable: true })
  preferred_name?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  country_code?: string;

  @Field(() => String, { nullable: true })
  mobile_number?: string;

  @Field(() => Boolean, { nullable: true })
  is_active?: boolean;

  @Field(() => Boolean, { nullable: true })
  is_email_verified?: boolean;

  @Field(() => Boolean, { nullable: true })
  is_mobile_verified?: boolean;

  @Field(() => String, { nullable: true })
  created_on?: string;

  @Field(() => String, { nullable: true })
  orgName?: string;

  @Field(() => Boolean, { nullable: true })
  is_kyc_completed?: boolean;

  @Field(() => String, { nullable: true })
  kyc_case_id?: string;

  @Field(() => String, { nullable: true })
  org_id?: string;

  @Field(() => [String], { nullable: true })
  roles?: string[];

  @Field(() => String, { nullable: true })
  avatarGender?: string;

  @Field(() => profileAssets, { nullable: true })
  profile_assets?: profileAssets;

  @Field(() => String, { nullable: true })
  gender: string;

  @Field(() => String, { nullable: true })
  dob: string;

  @Field(() => String, { nullable: true })
  customAvatarUrl: string;

  @Field(() => String, { nullable: true })
  profileLink?: string;

  @Field(() => String, { nullable: true })
  coverPhoto?: string;

  @Field(() => String, { nullable: true })
  thumbnail?: string;

  @Field(() => SocialMediaResponse, { nullable: true })
  socialMedia?: SocialMediaResponse;

}

@ObjectType()
export class VerifyMobileResponse {
  @Field(() => Boolean, { nullable: true })
  isEmailVerified: boolean;

  @Field(() => String, { nullable: true })
  message: string;

  @Field(() => Boolean, { nullable: true })
  isMobileVerified: boolean;
}
@ObjectType()
export class ResendOtpResponse {
  @Field(() => Boolean, { nullable: true })
  verifyIdentifier: boolean;

  @Field(() => String, { nullable: true })
  userId: string;

  @Field(() => String, { nullable: true })
  message: string;
}

@ObjectType()
export class kycStatus {
  @Field(() => Boolean, { nullable: true })
  is_kyc_completed: boolean;

  @Field(() => String, { nullable: true })
  kyc_case_id: string;

  @Field(() => String, { nullable: true })
  first_name: string;

  @Field(() => String, { nullable: true })
  last_name: string;

  @Field(() => String, { nullable: true })
  status: string;

  @Field(() => String, { nullable: true })
  gender: string;

  @Field(() => String, { nullable: true })
  dob: string;
}

@ObjectType()
export class OrganizerProfileUpdate {

  @Field(() => String, { nullable: true })
  coverPhoto?: string;

  @Field(() => String, { nullable: true })
  thumbnail?: string;

  @Field(() => SocialMediaResponse, { nullable: true })
  socialMedia?: SocialMediaResponse;


}
