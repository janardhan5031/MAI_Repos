import axios from "axios";
import { HttpStatus, Injectable } from "@nestjs/common";
import { LoggingService } from "../logging/logging.service";
import { ErrorService } from "./errorService";
import {
  ChanePasswordInput,
  RegisterVendor,
} from "src/modules/auth/dto/auth.input_types";
import { addArtistInput } from "src/modules/artist/dto/artist.input_types";
import { ConfigurationService } from "../config/config.service";
import {
  ERROR_MESSAGES,
  LOG_MESSAGES,
  ROLES,
  SUCCESS_MESSAGE,
} from "../config/constants";

@Injectable()
export class AuthEngine {
  AUTH_SECRET: string;
  AUTH_URL: string;
  VENDOR_AUTH_SECRET: string;
  constructor(
    private readonly errorService: ErrorService,
    private readonly logginServicer: LoggingService,
    private readonly config: ConfigurationService
  ) {
    this.AUTH_SECRET = this.config.get("AUTH_SECRET");
    this.AUTH_URL = this.config.get("AUTH_ENGINE_BASE_URL");
    this.VENDOR_AUTH_SECRET = this.config.get("VENDOR_AUTH_SECRET");
  }

  async registration(input: RegisterVendor) {
    try {
      const data: any = {
        orgName: input.organizationName,
        password: input.password,
        email: input.email,
        admin: { firstName: input.firstName, lastName: input.lastName },
        roles: [ROLES.EVENT_ORGANIZER],
      };
      const config = {
        method: "post",
        url: `${this.config.get("AUTH_ENGINE_BASE_URL")}/organisation/register`,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": `${this.AUTH_SECRET}`,
        },
        data: data,
      };
      const response = await axios.request(config);
      return response;
    } catch (error) {
      this.logginServicer.error(
        LOG_MESSAGES.ORGANIZER_REGISTRATION_LOG_ERROR,
        error
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async inviteRegistration(input: addArtistInput) {
    try {
      const data: any = input;
      delete data.preferredName;
      data.redirectURL = `${this.config.get(
        "PEM_FRONTEND_LINK"
      )}/register_via_token?role=artist`;
      const config = {
        method: "post",
        url: `${this.config.get("AUTH_ENGINE_BASE_URL")}/user/invite`,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": `${this.AUTH_SECRET}`,
        },
        data: data,
      };
      const response = await axios.request(config);
      return response;
    } catch (error) {
      this.logginServicer.error(
        `${LOG_MESSAGES.ONBOARD_ARTIST_LOG_ERROR} artist`,
        error
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async inviteVendorRegistration(input: any, isVendor: boolean) {
    try {
      const data: any = {
        orgName: input.orgName,
        admin: {
          firstName: input.firstName,
          lastName: input.lastName,
        },
        // preferredName: null,
        email: input.email,
        roles: input.roles,
        redirectUrl: isVendor
          ? `${this.config.get(
              "PECOM_FRONTEND_LINK"
            )}/register_via_token?role=vendor`
          : `${this.config.get(
              "PEM_FRONTEND_LINK"
            )}/register_via_token?role=advertiser`,
      };
      const config = {
        method: "post",
        url: `${this.AUTH_URL}/organisation/invite`,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": isVendor
            ? `${this.VENDOR_AUTH_SECRET}`
            : `${this.AUTH_SECRET}`,
        },
        data: data,
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      this.logginServicer.error(
        `${LOG_MESSAGES.ONBOARD_ARTIST_LOG_ERROR} ${
          isVendor ? "vendor" : "advertiser"
        }`,
        error
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async setPassword(password: string, isArtist: boolean, access_token: string) {
    try {
      const config = {
        method: "post",
        url: `${this.AUTH_URL}/${
          isArtist ? "user" : "organisation"
        }/set-password/validate`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
          "x-client-secret": `${this.AUTH_SECRET}`,
        },
        data: {
          password,
        },
      };

      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      this.logginServicer.error(LOG_MESSAGES.UPDATE_PASSWORD_ERROR_LOG, error);
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async kycStatusCheck(email: string, access_token: string) {
    try {
      const config = {
        method: "post",
        url: `${this.AUTH_URL}/user/get-kyc-details`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
          "x-client-secret": `${this.AUTH_SECRET}`,
        },
        data: {
          email: email,
        },
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      this.logginServicer.error(LOG_MESSAGES.KYC_CHECK_LOG_ERROR, error);
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async login(email: string, password: string, isArtist: boolean) {
    try {
      const config = {
        method: "post",
        url: `${this.AUTH_URL}/login`,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": `${this.AUTH_SECRET}`,
        },
        data: { email, password },
      };
      const response = await axios.request(config);
      return response;
    } catch (error) {
      this.logginServicer.error(LOG_MESSAGES.LOGIN_LOG_ERROR, error);
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async refresh_token(access_token: string, refresh_token: string) {
    try {
      const config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${this.AUTH_URL}/login/token/refresh`,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": `${this.AUTH_SECRET}`,
          refresh_token: `${refresh_token}`,
        },
      };
      const response = await axios.request(config);
      return response;
    } catch (error) {
      this.logginServicer.error(LOG_MESSAGES.REFRESH_TOKEN_LOG_ERROR, error);
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }
  async verifyOTP(userId: string, emailOtp: string, isArtist: boolean) {
    try {
      let url = isArtist
        ? `${this.AUTH_URL}/login/verify/otp`
        : `${this.AUTH_URL}/organisation/otp/verify`;
      const config = {
        method: "post",
        url: url,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": `${this.AUTH_SECRET}`,
        },
        data: { userId, emailOtp },
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async changePassword(
    changePasswordInput: ChanePasswordInput,
    isArtist: boolean,
    access_token: string
  ) {
    try {
      const config = {
        method: "post",
        url: `${this.AUTH_URL}/${
          isArtist ? "login" : "organisation"
        }/change-password`,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": `${this.AUTH_SECRET}`,
          Authorization: `Bearer ${access_token}`,
        },
        data: { ...changePasswordInput },
      };

      const response = await axios.request(config);
      return response;
    } catch (error) {
      this.logginServicer.error(
        `${LOG_MESSAGES.CHANGE_PASSWORD_LOG_ERROR} from auth`,
        error
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async forgotPassword(identifier: string) {
    try {
      const config = {
        method: "post",
        url: `${this.AUTH_URL}/login/forgot-password`,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": `${this.AUTH_SECRET}`,
        },
        data: { identifier: identifier },
      };

      const response = await axios.request(config);
      return response;
    } catch (error) {
      this.logginServicer.error(
        `${LOG_MESSAGES.FORGOT_PASSWORD_LOG_ERROR} from auth`,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async validateForgotPassword(
    password: string,
    otp: string,
    identifier: string,
    isArtist: boolean
  ) {
    try {
      const config = {
        method: "post",
        url: `${this.AUTH_URL}/${
          isArtist ? "login" : "organisation"
        }/forgot-password/validate`,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": `${this.AUTH_SECRET}`,
        },
        data: { password, otp, identifier },
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      this.logginServicer.error(
        "Validate password error in Auth",
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async logout(access_token: string) {
    try {
      const config = {
        method: "get",
        url: `${this.AUTH_URL}/login/session/destroy`,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": `${this.AUTH_SECRET}`,
          Authorization: `Bearer ${access_token}`,
        },
      };
      const response = await axios.request(config);
      return response;
    } catch (error) {
      this.logginServicer.error(
        `${LOG_MESSAGES.LOGOUT_ERROR_LOG} from Auth`,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async resend_otp(userId: string, isArtist: boolean) {
    try {
      const config = {
        method: "post",
        url: isArtist
          ? `${this.AUTH_URL}/login/otp/resend`
          : `${this.AUTH_URL}/organisation/otp/resend`,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": `${this.AUTH_SECRET}`,
        },
        data: { userId },
      };
      const response = await axios.request(config);
      return response;
    } catch (error) {
      this.logginServicer.error(
        `${LOG_MESSAGES.RESEND_OTP_LOG_ERROR} from Auth`,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async updateOrganisation(input, loginResponse) {
    try {
      const config = {
        method: "post",
        url: `${this.AUTH_URL}/organisation/update`,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": `${this.AUTH_SECRET}`,
          Authorization: `Bearer ${loginResponse.access_token}`,
        },
        data: { address: input },
      };
      const response = await axios.request(config);
      if (response.data.isOk) {
        response.data.message = SUCCESS_MESSAGE.ORG_ADDRESS_UPDATED_SUCCESS;
      }
      return response;
    } catch (error) {
      this.logginServicer.error(
        `${LOG_MESSAGES.UPDATE_ORGANIZER_LOG_ERROR} from Auth`,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async updateuserProfile(name, loginResponse) {
    try {
      const data = {
        mobileNumber: "",
        countryCode: "",
        email: "",
        firstName: "",
        lastName: "",
        // preferredName: name,
      };
      const config = {
        method: "post",
        url: `${this.AUTH_URL}/login/update/profile-details`,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": `${this.AUTH_SECRET}`,
          Authorization: `Bearer ${loginResponse.access_token}`,
        },
        data: data,
      };
      /*Calling auth engine to check mobile number is valid or not.*/
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      this.logginServicer.error(
        `Update Organisation error in Auth`,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async resendVerificationLink(input, isVendor) {
    try {
      input["redirectUrl"] = isVendor
        ? `${this.config.get(
            "PECOM_FRONTEND_LINK"
          )}/register_via_token?role=vendor`
        : `${this.config.get(
            "PEM_FRONTEND_LINK"
          )}/register_via_token?role=advertiser`;
      const config = {
        method: "post",
        url: `${this.AUTH_URL}/organisation/verification-email/resend`,
        headers: {
          "Content-Type": "application/json",
          "x-client-secret": `${this.AUTH_SECRET}`,
        },
        data: input,
      };
      const response = await axios.request(config);
      return response;
    } catch (error) {
      this.logginServicer.error(
        `${LOG_MESSAGES.RESEND_VERIFICATION_LINK_ERROR_LOG} from Auth`,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }

  async fetchFileFromUrl(fileUrl) {
    try {
      const response = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });

      const buffer = Buffer.from(response.data);

      /*return fetched file.*/
      return {
        fieldname: "file",
        originalname: fileUrl.split("/").pop(),
        encoding: "7bit",
        mimetype: "model/gltf-binary",
        buffer,
        size: buffer.length,
      };
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.FETCH_FILE}: ${error.message}`);
    }
  }

  async uploadAvatar(fileUrl, loginResponse) {
    try {
      if (!loginResponse) {
        this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_ACCESS_TOKEN },
          HttpStatus.UNAUTHORIZED
        );
      }
      /*read the glb file from axios.*/
      const file = await this.fetchFileFromUrl(fileUrl);

      /*fetched file send to formData.*/
      const formData = new FormData();
      const blob = new Blob([file.buffer], { type: file.mimetype });
      /*appending file to the varaibel avatar.*/
      formData.append("avatar", blob, file.originalname);

      /*config to send formdata to auth.*/
      const config = {
        method: "post",
        url: `${this.AUTH_URL}/user/upload/profile-assets`,
        headers: {
          Authorization: `Bearer ${loginResponse.access_token}`,
        },
        data: formData,
      };

      /*return response data.*/
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      this.logginServicer.error(
        `${LOG_MESSAGES.UPLOAD_AVATAR_LOG_ERROR} from Auth`,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error.message }, errorCode);
    }
  }

  async getProfileDetials(loginResponse) {
    try {
      const config = {
        method: "post",
        url: `${this.AUTH_URL}/login/profile-details`,
        headers: {
          Authorization: `Bearer ${loginResponse.access_token}`,
          "x-client-secret": `${this.AUTH_SECRET}`,
        },
      };
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      this.logginServicer.error(
        `${LOG_MESSAGES.GET_PROFILE_LOG_ERROR} from auth`,
        JSON.stringify(error)
      );
      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error.message }, errorCode);
    }
  }
}
