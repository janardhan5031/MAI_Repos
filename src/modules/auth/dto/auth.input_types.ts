import { Field, InputType } from "@nestjs/graphql";
import {
  IsAlpha,
  IsEmail,
  IsNotEmpty,
  IsUrl,
  Length,
  NotContains,
  Validate,
  ValidateIf,
} from "class-validator";
import {
  CheckIsNumber,
  RemoveWhiteSpaces,
  FrontAndBackSpacesAndSpecialSymbols,
  ValidatePassword,
  IsValidEmail,
  HaveMiddleSpaces,
} from "../../../common/shared/inputValidator";
import { ENUM_ROLE, ERROR_MESSAGES } from "src/common/config/constants";

@InputType()
export class RegisterVendor {
  @Field(() => String)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @Validate(FrontAndBackSpacesAndSpecialSymbols, {
    message: ERROR_MESSAGES.ORG_NAME_ERROR_MSG,
  })
  @Length(1, 32, {
    message: ERROR_MESSAGES.ORG_NAME_LENGTH,
  })
  organizationName: string;

  @Field(() => String)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_FIRST_NAME,
  })
  @Validate(FrontAndBackSpacesAndSpecialSymbols, {
    message: ERROR_MESSAGES.INVALID_FIRST_NAME,
  })
  @Length(1, 32, { message: ERROR_MESSAGES.INVALID_FIRST_NAME_LENGTH })
  firstName: string;

  @Field(() => String)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @IsAlpha()
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_LAST_NAME,
  })
  @Validate(FrontAndBackSpacesAndSpecialSymbols, {
    message: ERROR_MESSAGES.INVALID_LAST_NAME,
  })
  @Length(1, 32, { message: ERROR_MESSAGES.INVALID_LAST_NAME_LENGTH })
  lastName: string;

  @Field(() => String)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_PASSWORD,
  })
  @Validate(ValidatePassword, {
    message: ERROR_MESSAGES.INVALID_PASSWORD,
  })
  password: string;

  @Field(() => String)
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL })
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_EMAIL,
  })
  @Validate(IsValidEmail, { message: ERROR_MESSAGES.INVALID_EMAIL_FORMAT })
  email: string;

  @Field(() => Boolean)
  @IsNotEmpty()
  isTermsAgreed: boolean;
}

@InputType()
export class Login {
  @Field(() => String)
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_EMAIL,
  })
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL })
  @IsNotEmpty()
  @Validate(IsValidEmail, { message: ERROR_MESSAGES.INVALID_EMAIL_FORMAT })
  email: string;

  @Field(() => String)
  @IsNotEmpty({ message: ERROR_MESSAGES.EMPTY_PASSWORD })
  password: string;
}

@InputType()
export class UserIdValidation {
  @Field(() => String)
  @NotContains("undefined")
  @NotContains("null")
  @IsNotEmpty()
  userId: string;
}

@InputType()
export class VerifyOTPInput extends UserIdValidation {
  @Field(() => String, { nullable: true })
  mobileOtp: string;

  @Field(() => String, { nullable: true })
  @Validate(RemoveWhiteSpaces, {
    message: `Email ${ERROR_MESSAGES.OTP_INVALID}`,
  })
  @Validate(CheckIsNumber, {
    message: `Email ${ERROR_MESSAGES.OTP_INVALID_NUMBER}`,
  })
  emailOtp?: string;
}

@InputType()
export class VerifyMobileOTPInput extends UserIdValidation {
  @Field(() => String)
  @IsNotEmpty()
  @Validate(RemoveWhiteSpaces, {
    message: `Mobile ${ERROR_MESSAGES.OTP_INVALID}`,
  })
  @Validate(CheckIsNumber, {
    message: `Mobile ${ERROR_MESSAGES.OTP_INVALID_NUMBER}`,
  })
  mobileOtp: string;
}

@InputType()
export class ChanePasswordInput {
  @Field(() => String)
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_OLD_PASSWORD,
  })
  @Validate(ValidatePassword, {
    message: `Old ${ERROR_MESSAGES.INVALID_PASSWORD}`,
  })
  oldPassword: string;

  @Field(() => String)
  @IsNotEmpty()
  @Validate(RemoveWhiteSpaces, {
    message: `New ${ERROR_MESSAGES.EMPTY_PASSWORD}`,
  })
  @Validate(ValidatePassword, {
    message: `New ${ERROR_MESSAGES.INVALID_PASSWORD}`,
  })
  newPassword: string;
}

@InputType()
export class forgotPasswordInput {
  @Field(() => String)
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_EMAIL,
  })
  @Validate(IsValidEmail, { message: ERROR_MESSAGES.INVALID_EMAIL_FORMAT })
  @IsNotEmpty({ message: ERROR_MESSAGES.EMPTY_EMAIL })
  identifier: string;
}

@InputType()
export class ValidateForgotPasswordInput {
  @Field(() => String)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_PASSWORD,
  })
  @Validate(ValidatePassword, {
    message: ERROR_MESSAGES.INVALID_PASSWORD,
  })
  password: string;

  @Field(() => String)
  @IsNotEmpty()
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.OTP_INVALID,
  })
  @Validate(CheckIsNumber, { message: ERROR_MESSAGES.OTP_INVALID_NUMBER })
  @Length(6, 6, { message: ERROR_MESSAGES.OTP_INVALID })
  otp: string;

  @Field(() => String)
  @Field(() => String)
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_EMAIL,
  })
  @Validate(IsValidEmail, { message: ERROR_MESSAGES.INVALID_EMAIL_FORMAT })
  @IsNotEmpty({ message: ERROR_MESSAGES.EMPTY_EMAIL })
  identifier: string;
}

@InputType()
export class RegisterMobileInput {
  @Field(() => String)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_COUNTRY_CODE,
  })
  countryCode: string;

  @Field(() => String)
  @IsNotEmpty()
  @Length(10, 10, { message: ERROR_MESSAGES.INVALID_MOBILE_NUMBER })
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_MOBILE,
  })
  @Validate(CheckIsNumber, {
    message: ERROR_MESSAGES.INVALID_MOBILE_NUMBER,
  })
  mobileNumber: string;
}

@InputType()
export class addRegistrationInput {
  @Field(() => String)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @Validate(FrontAndBackSpacesAndSpecialSymbols, {
    message: ERROR_MESSAGES.ORG_NAME_ERROR_MSG,
  })
  @Length(1, 32, {
    message: ERROR_MESSAGES.ORG_NAME_LENGTH,
  })
  orgName: string;

  @Field(() => String)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_FIRST_NAME,
  })
  @Validate(FrontAndBackSpacesAndSpecialSymbols, {
    message: ERROR_MESSAGES.INVALID_FIRST_NAME,
  })
  @Length(1, 32, { message: ERROR_MESSAGES.INVALID_FIRST_NAME_LENGTH })
  firstName: string;

  @Field(() => String)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @IsAlpha()
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_LAST_NAME,
  })
  @Validate(FrontAndBackSpacesAndSpecialSymbols, {
    message: ERROR_MESSAGES.INVALID_LAST_NAME,
  })
  @Length(1, 32, { message: ERROR_MESSAGES.INVALID_LAST_NAME_LENGTH })
  lastName: string;

  @Field(() => String)
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL })
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_EMAIL,
  })
  @Validate(IsValidEmail, { message: ERROR_MESSAGES.INVALID_EMAIL_FORMAT })
  email: string;
}

@InputType()
export class UpdateOrganizationInput {
  @Field(() => String)
  @IsNotEmpty()
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_ADDRESS,
  })
  @Length(1, 50, {
    message: ERROR_MESSAGES.ORG_ADDRESS,
  })
  address: string;

  @Field(() => String)
  @IsNotEmpty()
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_CITY,
  })
  @Length(1, 50, {
    message: ERROR_MESSAGES.ORG_CITY,
  })
  city: string;

  @Field(() => String)
  @IsNotEmpty()
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_STATE,
  })
  @Length(1, 50, {
    message: ERROR_MESSAGES.ORG_STATE,
  })
  state: string;

  @Field(() => String)
  @IsNotEmpty()
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_COUNTRY,
  })
  @Length(3, 50, {
    message: ERROR_MESSAGES.ORG_COUNTRY,
  })
  country: string;

  @Field(() => String)
  @IsNotEmpty()
  @Length(6, 6, { message: ERROR_MESSAGES.ORG_ZIPCODE })
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_ZIPCODE,
  })
  @Validate(HaveMiddleSpaces, {
    message: ERROR_MESSAGES.ORG_ZIPCODE,
  })
  @Validate(CheckIsNumber, { message: ERROR_MESSAGES.ORG_ZIPCODE })
  zipcode: string;
}
@InputType()
export class ResendVerifcationLinkInput {
  @Field(() => String)
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL })
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  @Validate(RemoveWhiteSpaces, {
    message: ERROR_MESSAGES.EMPTY_EMAIL,
  })
  @Validate(IsValidEmail, { message: ERROR_MESSAGES.INVALID_EMAIL_FORMAT })
  email: string;
}

@InputType()
export class checkKYCInput extends UserIdValidation {

  @Field(() => ENUM_ROLE)
  @IsNotEmpty()
  @NotContains("undefined")
  @NotContains("null")
  role: ENUM_ROLE;
}

@InputType()
export class organizerProfileInput {
  @Field(() => String, { nullable: true })
  @ValidateIf((obj, value) => value !== undefined && value !== null && value !== '')
  @IsUrl({}, { message: ERROR_MESSAGES.INVALID_URL })
  instaLink?: string;

  @Field(() => String, { nullable: true })
  @ValidateIf((obj, value) => value !== undefined && value !== null && value !== '')
  @IsUrl({}, { message: ERROR_MESSAGES.INVALID_URL })
  facebookLink?: string;

  @Field(() => String, { nullable: true })
  @ValidateIf((obj, value) => value !== undefined && value !== null && value !== '')
  @IsUrl({}, { message: ERROR_MESSAGES.INVALID_URL })
  twitterLink?: string;

  @Field(() => String, { nullable: true })
  @ValidateIf((obj, value) => value !== undefined && value !== null && value !== '')
  @IsUrl({}, { message: ERROR_MESSAGES.INVALID_URL })
  coverPhoto?: string;

  @Field(() => String, { nullable: true })
  @ValidateIf((obj, value) => value !== undefined && value !== null && value !== '')
  @IsUrl({}, { message: ERROR_MESSAGES.INVALID_URL })
  thumbnail?: string;
}
