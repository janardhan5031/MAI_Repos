import { Args, Mutation, Resolver, Query, Context } from "@nestjs/graphql";
import { AuthService } from "./auth.service";
import {
  kycStatus,
  LoginResponse,
  OrganizerProfileUpdate,
  ResendOtpResponse,
  SocialMediaResponse,
  VerifyMobileResponse,
} from "./dto/auth.response";
import {
  ChanePasswordInput,
  Login,
  RegisterVendor,
  ValidateForgotPasswordInput,
  VerifyOTPInput,
  addRegistrationInput,
  forgotPasswordInput,
  UpdateOrganizationInput,
  ResendVerifcationLinkInput,
  checkKYCInput,
  organizerProfileInput,
} from "./dto/auth.input_types";
import { NewEntryResponse } from "../../common/shared/common.responses";
import { ERROR_MESSAGES } from "src/common/config/constants";

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) { }

  @Mutation(() => NewEntryResponse)
  async registration(@Args("registration") registerInput: RegisterVendor) {
    return await this.authService.registration(registerInput);
  }

  @Mutation(() => NewEntryResponse)
  async inviteRegistration(
    @Args("addInput") addInput: addRegistrationInput,
    @Args("isVendor", { nullable: true, defaultValue: false })
    isVendor: boolean,
    @Context() context: any
  ) {
    return await this.authService.onboardViaInvite(
      addInput,
      isVendor,
      context.req.loginResponse
    );
  }

  @Mutation(() => OrganizerProfileUpdate)
  async updateOrganizerProfile(
    @Args("organizerProfileInput") organizerProfileInput: organizerProfileInput,
    @Context() context: any
  ) {
    return await this.authService.updateOrganizerProfile(
      organizerProfileInput,
      context.req.loginResponse
    );
  }

  @Mutation(() => LoginResponse)
  async login(
    @Args("login") loginInput: Login,
    @Args("isArtist", { nullable: true, defaultValue: false }) isArtist: boolean
  ) {
    return await this.authService.login(loginInput, isArtist);
  }

  // for organizer mobile verification
  @Mutation(() => VerifyMobileResponse)
  async verifyOTP(
    @Args("verifyOTPInput") verifyOTPInput: VerifyOTPInput,
    @Args("isArtist", { nullable: true, defaultValue: false }) isArtist: boolean
  ) {
    return await this.authService.verifyOTP(verifyOTPInput, isArtist);
  }

  @Mutation(() => NewEntryResponse)
  async changePassword(
    @Args("changePasswordInput") changePasswordInput: ChanePasswordInput,
    @Args("isArtist", { nullable: true, defaultValue: false })
    isArtist: boolean,
    @Context() context: any
  ) {
    return await this.authService.changePassword(
      changePasswordInput,
      isArtist,
      context.req.loginResponse
    );
  }

  // for orgazer
  @Mutation(() => NewEntryResponse)
  async forgotPassword(
    @Args("forgotPasswordInput") input: forgotPasswordInput
  ) {
    return await this.authService.forgotPassword(input.identifier);
  }

  @Mutation(() => NewEntryResponse)
  async validateForgotPassword(
    @Args("input") input: ValidateForgotPasswordInput,
    @Args("isArtist", { nullable: true, defaultValue: false }) isArtist: boolean
  ) {
    return await this.authService.validateForgotPassword(
      input.password,
      input.otp,
      input.identifier,
      isArtist
    );
  }

  @Mutation(() => ResendOtpResponse)
  async resendOTP(
    @Args("userId") userId: string,
    @Args("isArtist", { nullable: true, defaultValue: false }) isArtist: boolean
  ) {
    /*inline validation*/
    return await this.authService.resendOtp(userId, isArtist);
  }

  // RefreshToken mutation
  @Mutation(() => LoginResponse)
  async refreshToken(@Context() context: any) {
    return await this.authService.refreshToken(
      context.req.headers.authorization,
      context.req.headers.refresh_token
    );
  }

  @Mutation(() => NewEntryResponse)
  async logout(@Context() context: any) {
    return await this.authService.logout(context.req.loginResponse);
  }

  @Mutation(() => NewEntryResponse)
  async updateOrganisation(
    @Args("input") input: UpdateOrganizationInput,
    @Context() context: any
  ) {
    return await this.authService.updateOrganisation(
      input,
      context.req.loginResponse
    );
  }

  @Mutation(() => NewEntryResponse)
  async resendVerficationLink(
    @Args("input") input: ResendVerifcationLinkInput,
    @Args("isVendor", { nullable: true, defaultValue: false }) isVendor: boolean
  ) {
    return await this.authService.resendVerificationLink(input, isVendor);
  }

  @Mutation(() => NewEntryResponse)
  async updateGender(
    @Args("avatarCode") avatarCode: string,
    @Context() context: any
  ) {
    if (avatarCode === null || avatarCode === undefined || avatarCode === "") {
      return new Error(ERROR_MESSAGES.AVATAR_CODE_ERROR);
    }

    return await this.authService.updateGender(
      avatarCode,
      context.req.loginResponse
    );
  }

  @Query(() => kycStatus)
  async checkKYC(
    @Args("checkKYCInput") checkKYCInput: checkKYCInput,
    @Context() context: any
  ) {
    return await this.authService.checkKYC(
      checkKYCInput.userId,
      checkKYCInput.role,
      context.req.loginResponse
    );
  }

  @Query(() => LoginResponse)
  async getProfileDetails(@Context() context: any) {
    return await this.authService.getProfileDetails(context.req.loginResponse);
  }
}
