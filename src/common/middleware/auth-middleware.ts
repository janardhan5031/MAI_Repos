import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { RedisHelperService } from "../redis-helpers/redis-helper.service";
import { URLcheck, skipValidation } from "./validate";
import { ConfigurationService } from "../config/config.service";
import { ErrorService } from "../services/errorService";
import axios from "axios";
import { LoggingService } from "../logging/logging.service";
import { ERROR_MESSAGES } from "../config/constants";
import { isValidTimeZone } from "../helper/helper";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private AUTH_ENGINE_URL: string;
  private AUTH_SECRET: string;
  private DB_URL: string;
  constructor(
    private readonly config: ConfigurationService,
    private readonly loggingService: LoggingService,
    private readonly redisHelper: RedisHelperService,
    private readonly errorService: ErrorService
  ) {
    this.AUTH_SECRET = this.config.get("AUTH_SECRET");
    this.AUTH_ENGINE_URL = this.config.get("AUTH_ENGINE_BASE_URL");
    this.DB_URL = this.config.get("DATABASE_CONNECTION");
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const access_token = req.headers["authorization"];
    const userTimeZone = req.headers["x-time-zone"];
    const paymentSkip = req.headers["x-payment-skip"];
    if (!isValidTimeZone(userTimeZone)) {
      this.errorService.error(
        { message: ERROR_MESSAGES.INVALID_TIMEZONE },
        400
      );
    }
    const query = req?.body?.query;
    const url = req?.originalUrl;
    req["userTimeZone"] = userTimeZone;
    req["paymentSkip"] = paymentSkip;
    const skipValidations = skipValidation(query, req.body.operationName);
   const urlvalidation = URLcheck(url);
    // skip the access token validation for login and registration
    if ((skipValidations && !!query) || (!urlvalidation && !query)) {
      return next();
    }
    if (!access_token) {
      return this.errorService.error(
        { message: ERROR_MESSAGES.INVALID_ACCESS_TOKEN },
        401
      );
    }
    try {
      if (userTimeZone === null || userTimeZone === undefined) {
        this.errorService.error(
          { message: ERROR_MESSAGES.USER_TIMEZONE_ERROR },
          400
        );
      }
      const config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${this.AUTH_ENGINE_URL}/login/token/introspect`,
        headers: {
          Authorization: req.headers.authorization,
          "x-client-secret": this.AUTH_SECRET,
        },
      };
      const response = await axios(config);
      const loginResponse = await this.redisHelper.getLoginResponse(
        access_token
      );
      if (!loginResponse) {
        return this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_ACCESS_TOKEN },
          401
        );
      }
      req["loginResponse"] = loginResponse;
      return next();
    } catch (error) {
      const errorCode =
        error?.response?.data?.statusCode !== undefined
          ? error?.response?.data?.statusCode
          : error?.status
            ? error.status
            : 401;
      this.errorService.error({ message: error }, errorCode);
    }
  }
}
