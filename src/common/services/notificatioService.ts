import { Injectable } from "@nestjs/common";
import { ConfigurationService } from "../config/config.service";
import { LoggingService } from "../logging/logging.service";
import { ErrorService } from "./errorService";
import axios from "axios";
import { ERROR_MESSAGES, LOG_MESSAGES } from "../config/constants";

@Injectable()
export class NotificationEngineService {
  private NOTIFICATION_ENGINE_BASE_URL: string;
  private NOTIFICATION_ENGINE_API_KEY: string;
  private NOTIFICATION_SENDER_ID: string;
  private LOAD_TEST: string;

  constructor(
    private readonly config: ConfigurationService,
    private readonly loggingService: LoggingService,
    private errorService: ErrorService
  ) {
    this.NOTIFICATION_ENGINE_BASE_URL = this.config.get(
      "NOTIFICATION_BASE_URL"
    );
    this.LOAD_TEST = this.config.get("LOAD_TEST");
    this.NOTIFICATION_ENGINE_API_KEY = this.config.get("NOTIFICATION_API_KEY");
    this.NOTIFICATION_SENDER_ID = this.config.get("NOTIFICATION_SENDER_ID");
  }
  async notification_call(body: any) {
    try {
      if (this.LOAD_TEST == "true") {
        this.loggingService.warn("NOTIFIATION ENGINE DISABLED");
        return;
      }
      const response = await axios.post(
        `${this.NOTIFICATION_ENGINE_BASE_URL}/send/notification`,
        body,
        {
          headers: {
            apiKey: this.NOTIFICATION_ENGINE_API_KEY,
            sender: this.NOTIFICATION_SENDER_ID,
          },
        }
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      this.errorService.error({ message: ERROR_MESSAGES.EMAIL_ERR }, 500);
    }
  }
}
