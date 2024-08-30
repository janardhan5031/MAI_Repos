import { ArtistModule } from "./../artist/artist.module";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { RedisHelperService } from "src/common/redis-helpers/redis-helper.service";
import { LoggingService } from "src/common/logging/logging.service";
import { Model } from "mongoose";
import {
  ChanePasswordInput,
  Login,
  RegisterVendor,
  VerifyOTPInput,
  addRegistrationInput,
  UpdateOrganizationInput,
  organizerProfileInput,
} from "./dto/auth.input_types";
import { AuthEngine } from "src/common/services/auth_engine";
import { Organizer } from "src/common/database/entities/organizer.entity";
import { Artist } from "src/common/database/entities/artist.entity";
import { ErrorService } from "src/common/services/errorService";
import { Advertiser } from "src/common/database/entities/advertiser.entity";
import { Vendor } from "src/common/database/entities/vendor.entity";
import { ConfigurationService } from "src/common/config/config.service";
import { KafkaService } from "src/common/kafka/kafka.service";
import axios from "axios";
import { NotificationEngine } from "src/common/services/notification_engine";
import {
  ERROR_MESSAGES,
  LOG_MESSAGES,
  ROLES,
  SUCCESS_MESSAGE,
} from "src/common/config/constants";
import { handleRole, trimProperties } from "src/common/helper/helper";
import { SocialMediaInput } from "../artist/dto/artist.input_types";
const { ObjectId } = require("mongodb");

@Injectable()
export class AuthService {
  ROLES: any;
  AVATAR_URL: string;
  constructor(
    private readonly loggingService: LoggingService,
    private readonly errorService: ErrorService,
    private readonly redisHelper: RedisHelperService,
    private readonly authEngine: AuthEngine,
    private readonly configService: ConfigurationService,
    private readonly notificationEngine: NotificationEngine,
    private readonly kafkaService: KafkaService,
    private readonly config: ConfigurationService,
    @InjectModel(Organizer.name)
    private readonly organizerModel: Model<Organizer>,
    @InjectModel(Artist.name)
    private readonly artistModel: Model<Artist>,
    @InjectModel(Advertiser.name)
    private readonly advertiserModel: Model<Advertiser>,
    @InjectModel(Vendor.name)
    private readonly vendorModel: Model<Vendor>
  ) {
    this.AVATAR_URL = this.config.get("AVATAR_URL");
    this.ROLES = {
      EVENT_ARTIST: this.artistModel,
      EVENT_ADVERTISER: this.advertiserModel,
      EVENT_ORGANIZER: this.organizerModel,
      EVENT_VENDOR: this.vendorModel,
    };
  }

  async registration(registerInput: RegisterVendor) {
    try {
      // Check if terms are agreed upon
      if (!registerInput?.isTermsAgreed) {
        throw this.errorService.error(
          { message: ERROR_MESSAGES.USER_TERMS_AND_CONDITIONS },
          400
        );
      }
      // Trim input values
      registerInput = trimProperties(registerInput);
      // Call registration method from authEngine
      const response = await this.authEngine.registration(registerInput);
      this.loggingService.log(
        `${LOG_MESSAGES.ORGANIZATION_REGISTERATION_LOG} ${JSON.stringify(
          registerInput
        )}`
      );
      registerInput["name"] =
        registerInput.firstName + " " + registerInput.lastName;
      registerInput["orgName"] = registerInput.organizationName;
      // Create a new organizer entity
      const newOrganizer = new this.organizerModel(registerInput);
      newOrganizer.userId = response.data._id;
      newOrganizer.createdAt = new Date();
      await newOrganizer.save().catch((error) => {
        // Log error if unable to save organizer entity
        this.loggingService.error(
          `${LOG_MESSAGES.ORGANIZER_REGISTRATION_ERROR_LOG}`,
          `${JSON.stringify(error)}`
        );
        this.errorService.error(
          { message: `${ERROR_MESSAGES.ORGANIZER_REGISTRATION}` },
          400
        );
      });
      /*Onboard Organizer Kafka call.*/
      this.kafkaService.sendMessage(
        this.configService.getKafkaTopic("ONBOARD_ORGANIZER"),
        newOrganizer
      );
      return response.data;
    } catch (error) {
      this.loggingService.error(
        `${LOG_MESSAGES.ORGANIZER_REGISTRATION_LOG_ERROR}`,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async login(loginInput: Login, isArtist: boolean) {
    try {
      // Destructuring loginInput
      const { email, password } = loginInput;
      // Calling authEngine's login method
      const result = await this.authEngine.login(email, password, isArtist);
     // Assigning userId from result.data._id or result.data.userId
      result.data._id = result.data?._id
        ? result.data?._id
        : result.data?.userId;
      // If there is a message in the result data, return it
      if (result?.data?.message) return result.data;
      // If user has no roles, throw an error
      if (result?.data?.roles?.length === 0) {
        this.errorService.error({ message: ERROR_MESSAGES.INVALID_LOGIN }, 400);
      }
      // Logging successful login
      this.loggingService.log(
        `${LOG_MESSAGES.LOGIN_LOG} ${result.data.email} `
      );
      // Creating a copy of result.data
      const data = { ...result.data };
      // Initializing flags and variables
      data.isOrganizer = false;
      data.isArtist = false;
      data.isAdvertiser = false;
      let avatarGender;
      let res;
      // Switching based on user roles
      switch (true) {
        case data?.roles?.includes(ROLES.EVENT_ORGANIZER):
          // Handling EVENT_ORGANIZER role
          data.isOrganizer = true;
          result.data.is_kyc_completed = data?.org_info[0].is_kyb_completed;
          res = await handleRole(
            result,
            this.organizerModel,
            result.data.is_kyc_completed
          );
          data.userId = res?.userId;
          avatarGender = res?.avatarGender;
          break;
        case data?.roles?.includes(ROLES.EVENT_ARTIST):
          // Handling EVENT_ARTIST role
          data.isArtist = true;
          result.data.is_kyc_completed = data.is_kyc_completed;
          res = await handleRole(
            result,
            this.artistModel,
            result.data.is_kyc_completed
          );
          data.artistId = res?.userId;
          avatarGender = res?.avatarGender;
          result.data.preferred_name = res?.preferredName;
          break;
        case data?.roles?.includes(ROLES.EVENT_ADVERTISER):
          // Handling EVENT_ADVERTISER role
          data.isAdvertiser = true;
          result.data.is_kyc_completed = data.org_info[0].is_kyb_completed;
          res = await handleRole(
            result,
            this.advertiserModel,
            result.data.is_kyc_completed
          );
          data.advertiserId = res?.userId;
          avatarGender = res?.avatarGender;
          break;
      }
      // Assigning avatarGender and address to result.data
      result.data.avatarGender = avatarGender;
      result.data.address = result?.data?.org_info
        ? result?.data?.org_info[0]
        : null;
      // Saving login response to Redis
      data.preferred_name = result?.data?.preferred_name;
      await this.redisHelper.saveLoginResponse(data);
      return result.data;
    } catch (error) {
      // Logging error
      this.loggingService.error(
        `${LOG_MESSAGES.LOGIN_LOG_ERROR} `,
        JSON.stringify(error)
      );
      return error;
    }
  }

  async verifyOTP(verifyOTP: VerifyOTPInput, isArtist: boolean) {
    try {
      // Calling authEngine's verifyOTP method
      const result = await this.authEngine.verifyOTP(
        verifyOTP.userId,
        verifyOTP.emailOtp,
        isArtist
      );
      // Retrieving organizer details from the database
      const organizerDetails = await this.organizerModel.findOneAndUpdate(
        {
          userId: verifyOTP.userId,
        },
        {
          isEmailVerified: true,
        },
        {
          new: true,
        }
      );
      // Creating an organizer object with necessary details
      const organizer = {
        userId: organizerDetails?.userId,
        email: organizerDetails?.email,
      };
      // Creating a data object with organizerName
      const data = {
        organizerName: organizerDetails.name,
      };
      // Sending a welcome email to the organizer
      this.notificationEngine.organizerWelcomeEmail(organizer, data);
      // Logging the verification process
      this.loggingService.log(
        `${LOG_MESSAGES.VERIFY_OTP_LOG} ${verifyOTP?.userId}`
      );
      return result;
    } catch (error) {
      // Logging error if verification fails
      this.loggingService.error(
        LOG_MESSAGES.VERIFY_OTP_LOG_ERROR,
        JSON.stringify(error)
      );
      return error;
    }
  }

  async changePassword(
    changePasswordInput: ChanePasswordInput,
    isArtist: boolean,
    loginResponse: any
  ) {
    try {
      // Calling authEngine's changePassword method
      const result = await this.authEngine.changePassword(
        changePasswordInput,
        isArtist,
        loginResponse.access_token
      );
      this.loggingService.log(`${LOG_MESSAGES.CHANGE_PASSWORD_LOG}`);
      // Returning the data from the result
      return result.data;
    } catch (error) {
      // Logging error if changing password fails
      this.loggingService.error(
        `${LOG_MESSAGES.CHANGE_PASSWORD_LOG_ERROR}`,
        JSON.stringify(error)
      );
      return error;
    }
  }

  async forgotPassword(email: string) {
    try {
      // Calling authEngine's forgotPassword method
      const result = await this.authEngine.forgotPassword(email);
      this.loggingService.log(`${LOG_MESSAGES.FORGOT_PASSWORD_LOG},${email}`);
      // Returning the data from the result
      return result.data;
    } catch (error) {
      // Logging error if forgot password process fails
      this.loggingService.error(
        LOG_MESSAGES.FORGOT_PASSWORD_LOG_ERROR,
        JSON.stringify(error)
      );

      return error;
    }
  }

  async validateForgotPassword(
    password: string,
    otp: string,
    identifier: string,
    isArtist: boolean
  ) {
    try {
      // Call the validateForgotPassword method of authEngine
      const result = await this.authEngine.validateForgotPassword(
        password,
        otp,
        identifier,
        isArtist
      );
      this.loggingService.log(
        `${LOG_MESSAGES.VALIDATE_FORGOT_PASSWORD_LOG},${identifier}`
      );
      // Return the result if successful
      return result;
    } catch (error) {
      // Log an error message if an exception occurs
      this.loggingService.error(
        LOG_MESSAGES.VALIDATE_FORGOT_PASSWORD_LOG_ERROR,
        JSON.stringify(error)
      );

      // Return the error object
      return error;
    }
  }

  async resendOtp(userId: string, isArtist: boolean) {
    try {
      // Call the authentication engine to resend OTP.
      const result = await this.authEngine.resend_otp(userId, isArtist);

      // Return the data from the result.
      return result.data;
    } catch (error) {
      // Log the error using the logging service, including detailed error information.
      this.loggingService.error(
        `${LOG_MESSAGES.RESEND_OTP_LOG_ERROR}`,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async refreshToken(accessToken: string, refreshToken: string) {
    try {
      const result = await this.authEngine.refresh_token(
        accessToken,
        refreshToken
      );
      // Save the refreshed login response to Redis
      this.redisHelper.clearLoginResponse(accessToken);
      // Creating a copy of result.data
      const data = { ...result.data };
      // Initializing flags and variables
      data.isOrganizer = false;
      data.isArtist = false;
      data.isAdvertiser = false;
      let avatarGender;
      let res;
      // Switching based on user roles
      switch (true) {
        case data?.roles?.includes(ROLES.EVENT_ORGANIZER):
          // Handling EVENT_ORGANIZER role
          data.isOrganizer = true;
          result.data.is_kyc_completed = data?.org_info
            ? data?.org_info[0].is_kyb_completed
            : data.is_kyb_completed;
          res = await handleRole(
            result,
            this.organizerModel,
            result.data.is_kyc_completed
          );
          data.userId = res?.userId;
          avatarGender = res?.avatarGender;
          break;
        case data?.roles?.includes(ROLES.EVENT_ARTIST):
          // Handling EVENT_ARTIST role
          data.isArtist = true;
          result.data.is_kyc_completed = data.is_kyc_completed;
          res = await handleRole(
            result,
            this.artistModel,
            result.data.is_kyc_completed
          );
          data.artistId = res?.userId;
          avatarGender = res?.avatarGender;
          result.data.preferred_name = res?.preferredName;
          result.data.profile_assets.avatar_url = res.customAvatarUrl
            ? res.customAvatarUrl
            : result.data.profile_assets.avatar_url;
          break;
        case data?.roles?.includes(ROLES.EVENT_ADVERTISER):
          // Handling EVENT_ADVERTISER role
          data.isAdvertiser = true;
          result.data.is_kyc_completed = data?.org_info
            ? data?.org_info[0].is_kyb_completed
            : data.is_kyb_completed;
          res = await handleRole(
            result,
            this.advertiserModel,
            result.data.is_kyc_completed
          );
          data.advertiserId = res?.userId;
          avatarGender = res?.avatarGender;
          break;
      }
      // Assigning avatarGender and address to result.data
      result.data.avatarGender = avatarGender;
      result.data.address = result?.data?.org_info
        ? result?.data?.org_info[0]
        : null;
      // Saving login response to Redis
      await this.redisHelper.saveLoginResponse(data);
      return result.data;
    } catch (error) {
      const message = ERROR_MESSAGES.REFRESH_ERROR;
      LoggingService.error(message, error);
      return error;
    }
  }

  async onboardViaInvite(
    vendorInput: addRegistrationInput,
    isVendor: boolean,
    loginResponse: any
  ) {
    try {
      // Check if the user is an organizer; if not, return unauthorized error.
      if (!loginResponse?.isOrganizer) {
        this.errorService.error(
          { message: ERROR_MESSAGES.NOT_AN_ORGANIZER },
          401
        );
      }
      // Trim unnecessary properties from the vendor input.
      vendorInput = trimProperties(vendorInput);
      let response;
      // Choose the registration process based on the user type.(ADVERTISER/VENDOR)
      if (isVendor) {
        response = await this.handleVendorRegistration(
          vendorInput,
          loginResponse
        );
      } else {
        response = await this.handleAdvertiserRegistration(
          vendorInput,
          loginResponse
        );
      }
      // Return the response from the registration process.
      return response;
    } catch (error) {
      // Log the error using the logging service and handle it with the error service.
      this.loggingService.error(LOG_MESSAGES.ONBOARD_ERROR_LOG, error);
      this.errorService.error(error, 400);
    }
  }

  async logout(loginResponse: any) {
    try {
      // Log the logout activity using the logging service.
      this.loggingService.log(
        `${LOG_MESSAGES.LOGOUT_LOG} ${loginResponse.email}`
      );
      // Call the authentication engine to perform the logout, using the access token from the login response.
      const result = await this.authEngine.logout(loginResponse.access_token);
      // Return the data from the result.
      return result.data;
    } catch (error) {
      // Log the error using the logging service, including detailed error information.
      this.loggingService.error(
        LOG_MESSAGES.LOGOUT_ERROR_LOG,
        JSON.stringify(error)
      );
      // Extract error code from the response data or default to 400.
      const errorCode = error?.response?.data?.statusCode || 400;
      // Call the error service to handle and log the error with the specified error code.
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async updateOrganisation(input: UpdateOrganizationInput, loginResponse: any) {
    try {
      this.loggingService.log(
        ` ${LOG_MESSAGES.UPDATE_ORGANIZER_LOG} ${loginResponse.email} `
      );
      const result = await this.authEngine.updateOrganisation(
        input,
        loginResponse
      );
      return result.data;
    } catch (error) {
      this.loggingService.error(
        LOG_MESSAGES.UPDATE_ORGANIZER_LOG_ERROR,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }
  // Asynchronously handles the vendor registration process.
  async handleVendorRegistration(vendorInput, loginResponse) {
    // Check if the vendor with the given email already exists; if yes, throw an error.
    const vendorExists = await this.checkExistingUserAndEmail.call(
      this,
      vendorInput.email,
      this.vendorModel,
      ERROR_MESSAGES.VENDOR_ALREADY_EXISTS
    );
    // Set the user roles to include the role of an event vendor.
    vendorInput[`roles`] = [ROLES.EVENT_VENDOR];
    // Send an invitation for vendor registration to the authentication engine.
    const response = await this.authEngine.inviteVendorRegistration(
      vendorInput,
      true
    );
    // If the vendor does not exist and the registration is successful, proceed with additional actions.
    if (!vendorExists && response) {
      // Prepare data for adding the vendor to the database.
      const data = {
        email: vendorInput.email,
        name: vendorInput.firstName + " " + vendorInput.lastName,
        userId: response._id,
        orgId: response.org_id,
        orgName: vendorInput.orgName,
        organizer: loginResponse._id,
        createdAt: new Date(),
      };
      // Add the vendor to the database.
      const newVendor: any = await this.addUser(
        this.vendorModel,
        data,
        ERROR_MESSAGES.ADDING_VENDOR_ISSUE
      );
      // Send a message to Kafka for further processing.
      await this.kafkaService.sendMessage(
        this.configService.getKafkaTopic(`VENDOR_TOPIC`),
        {
          ...vendorInput,
          _id: newVendor._id,
          userId: response._id,
          orgId: response.org_id,
          isNewVendor: true,
        }
      );
    }
    // Return the response from the authentication engine.
    return response;
  }

  async handleAdvertiserRegistration(vendorInput, loginResponse) {
    const advertiserExists = await this.checkExistingUserAndEmail.call(
      this,
      vendorInput.email,
      this.advertiserModel,
      ERROR_MESSAGES.ADVERTISER_ALREADY_EXISTS
    );
    vendorInput[`roles`] = [ROLES.EVENT_ADVERTISER];
    const response = await this.authEngine.inviteVendorRegistration(
      vendorInput,
      false
    );
    if (!advertiserExists && response) {
      const data = {
        email: vendorInput.email,
        name: vendorInput.firstName + " " + vendorInput.lastName,
        userId: response._id,
        orgId: response.org_id,
        orgName: vendorInput.orgName,
        organizer: loginResponse._id,
        createdAt: new Date(),
      };
      let user = await this.addUser(
        this.advertiserModel,
        data,
        ERROR_MESSAGES.ADDING_ADVERTISER_ISSUE
      );
      /*On board Advertiser.*/
      this.kafkaService.sendMessage(
        this.configService.getKafkaTopic("ONBOARD_ADVERTISER"),
        user
      );
    }
    return response;
  }

  async checkExistingUserAndEmail(email, model, errorMessage) {
    const userExists = await model.findOne({ email });
    if (userExists && userExists.isEmailVerified) {
      return this.errorService.error({ message: errorMessage }, 400);
    }
  }

  async addUser(model, data, errorMessage) {
    try {
      const user = await new model(data).save().catch((error) => {
        this.loggingService.error(errorMessage, error);
      });
      return user;
    } catch (error) {
      this.errorService.error({ message: errorMessage }, 400);
    }
  }

  async resendVerificationLink(input, isVendor) {
    try {
      const response = await this.authEngine.resendVerificationLink(
        input,
        isVendor
      );
      return response.data;
    } catch (error) {
      this.loggingService.error(
        LOG_MESSAGES.RESEND_VERIFICATION_LINK_ERROR_LOG,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async getAvatarAccessToken() {
    try {
      let data = new FormData();
      data.append("grant_type", "client_credentials");
      data.append("client_id", this.configService.get("AVATAR_CLIENTID"));
      data.append(
        "client_secret",
        this.configService.get("AVATAR_CLIENT_SECRET")
      );

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${this.AVATAR_URL}/o/token/`,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        data: data,
      };

      let response = await axios.request(config);

      return response.data;
    } catch (error) {
      this.loggingService.error(
        ERROR_MESSAGES.TOKEN_RETRIEVAL_ERROR,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async updateGender(avatarCode, loginResponse) {
    try {
      /*Retrieve Avatar Access Token */
      const { access_token = "" } = await this.getAvatarAccessToken();

      let config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${this.AVATAR_URL}/avatars/${avatarCode}/model_info/`,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      };
      const result = await axios.request(config);
      if (result.status === 200) {
        let avatarGender = result?.data?.pipeline_subtype;

        const { isOrganizer, isArtist, isAdvertiser } = loginResponse;

        let response;
        switch (true) {
          case isOrganizer:
            response = await this.organizerModel.updateOne(
              {
                _id: new ObjectId(loginResponse?.userId),
              },
              {
                avatarGender: avatarGender,
              }
            );
            break;
          case isArtist:
            response = await this.artistModel.updateOne(
              {
                _id: new ObjectId(loginResponse?.artistId),
              },
              {
                avatarGender: avatarGender,
              }
            );
            break;
          case isAdvertiser:
            response = await this.advertiserModel.updateOne(
              {
                _id: new ObjectId(loginResponse?.advertiserId),
              },
              {
                avatarGender: avatarGender,
              }
            );
            break;
        }

        if (response?.modifiedCount) {
          return {
            isOk: true,
            message: SUCCESS_MESSAGE.AVATAR_GENDER_SUCEESFULLY,
          };
        } else {
          return {
            isOk: false,
            message: ERROR_MESSAGES.AVATAR_GENDER_UPDATE,
          };
        }
      } else {
        return this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_AVATAR_CODE },
          400
        );
      }
    } catch (error) {
      this.loggingService.error(
        LOG_MESSAGES.AVATAR_GENDER_ERROR_LOG,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error(
        { message: ERROR_MESSAGES.INVALID_AVATAR_CODE },
        errorCode
      );
    }
  }
  // Function to check KYC status for a user
  async checkKYC(userId: string, Role, loginResponse) {
    try {
      // Retrieve user data based on userId and role
      let updateOwner = await this.ROLES[Role].findOne({ userId: userId });
      // If user not found, throw an error
      if (!updateOwner) {
        this.errorService.error(
          { message: ERROR_MESSAGES.USER_NOT_FOUND },
          400
        );
      }
      // Check KYC status using the authentication engine
      let response = await this.authEngine.kycStatusCheck(
        updateOwner.email,
        loginResponse.access_token
      );
      // If KYC is completed, update the user's KYC status
      if (response?.status) {
        updateOwner = await this.ROLES[Role].findOneAndUpdate(
          { userId: userId },
          {
            isKYCVerified: response.is_kyc_completed,
            kycStatus: response.status,
          },
          { new: true }
        );
      }
      // Return the result with the KYC status
      return response;
    } catch (error) {
      // Handle errors and log them
      this.loggingService.error(
        LOG_MESSAGES.KYC_CHECK_LOG_ERROR,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error.message }, errorCode);
    }
  }

  async getProfileDetails(loginResponse) {
    try {
      // Retrieve profile details using the authentication engine
      const response = await this.authEngine.getProfileDetials(loginResponse);
      if (response.roles.includes(ROLES.EVENT_ORGANIZER)) {
        let details = await this.organizerModel.findOne({ _id: new ObjectId(loginResponse.userId) })
        const defaultSocialMedia = {
          instaLink: null,
          facebookLink: null,
          twitterLink: null,
          // Add other fields as needed
        };
        if (details) {
          response["coverPhoto"] = details?.coverPhoto
          response["thumbnail"] = details?.thumbnail
          response["profileLink"] = "/" + details.orgName
          response["socialMedia"] = details?.socialMedia ?? defaultSocialMedia
        }
      }
      // Adjust profile details based on user roles
      response.orgName = response.roles?.includes(ROLES.EVENT_ARTIST)
        ? null
        : response?.org_info[0]?.orgname;
      response["address"] = response.roles?.includes(ROLES.EVENT_ARTIST)
        ? null
        : response?.org_info[0];
      let kyc = response.roles?.includes(ROLES.EVENT_ARTIST)
        ? response.is_kyc_completed
        : response.org_info[0].is_kyb_completed;
      response.is_kyc_completed = kyc;
      let KycDetails = await this.checkKYC(
        response._id,
        response.roles[0],
        loginResponse
      );
      response["kycStatus"] = KycDetails.status;

      // Return the adjusted profile details
      return response;
    } catch (error) {
      this.loggingService.error(
        LOG_MESSAGES.GET_PROFILE_LOG_ERROR,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error.message }, errorCode);
    }
  }
  async updateOrganizerProfile(organizerInput: organizerProfileInput, loginResponse) {
    try {

      if (!loginResponse.isOrganizer) {
        this.errorService.error(
          { message: ERROR_MESSAGES.USER_NOT_ORGANISER },
          400
        );
      }
      let organizer = await this.organizerModel.findOne({
        userId: loginResponse._id,
        isDeleted: false
      });
      if (!organizer) {
        this.errorService.error({ message: ERROR_MESSAGES.INVALID_ORGANIZER }, 401)
      }
      let json = {};
      json["coverPhoto"] = organizerInput.coverPhoto ? organizerInput.coverPhoto.trim().replace(/\s+/g, " ") : null
      json["thumbnail"] = organizerInput.thumbnail ? organizerInput.thumbnail.trim() : null
      json["socialMedia"] = {};
      json["socialMedia"]["facebookLink"] =
        organizerInput?.facebookLink
          ? organizerInput?.facebookLink.trim()
          : null;
      json["socialMedia"]["instaLink"] =
        organizerInput?.instaLink
          ? organizerInput?.instaLink.trim()
          : null
      json["socialMedia"]["twitterLink"] = organizerInput?.twitterLink
        ? organizerInput?.twitterLink.trim()
        : null

      let updatedDetails = await this.organizerModel.findOneAndUpdate({
        _id: organizer._id,
      }, json, { new: true })
      return updatedDetails
    } catch (error) {
      this.loggingService.error(
        LOG_MESSAGES.GET_PROFILE_LOG_ERROR,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error.message }, errorCode);
    }
  }
}
