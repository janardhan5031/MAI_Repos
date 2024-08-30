import { Global, Injectable } from "@nestjs/common";
import { ConfigurationService } from "../config/config.service";
import { ErrorService } from "./errorService";
import { LoggingService } from "../logging/logging.service";
import axios from "axios";

@Injectable()
@Global()
export class PaymentEngine {
  private PAYMENT_ENGINE_URL: string;
  private PAYMENT_ENGINE_API_KEY: string;
  constructor(
    private readonly config: ConfigurationService,
    private errorService: ErrorService
  ) {
    this.PAYMENT_ENGINE_URL = this.config.get("PAYMENT_ENGINE_URL");
    this.PAYMENT_ENGINE_API_KEY = this.config.get("PAYMENT_ENGINE_API_KEY");
  }

  async getTransaction(transactionId: string, loginResponse: any) {
    try {
      // call payment engine with trasactionID
      const data = "";
      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: `${this.PAYMENT_ENGINE_URL}/orders/verifyTransactionId?transactionId=${transactionId}`,
        headers: {
          apiKey: this.PAYMENT_ENGINE_API_KEY,
          // Authorization: `${loginResponse.access_token}`,
        },
        data: data,
      };
      let transactionResponse = await axios.request(config);
      LoggingService.log(
        `Successfully fetched transaction details from payment engine for user ${loginResponse.email}`
      );
      return transactionResponse.data.result;
    } catch (error) {
      LoggingService.error(
        `Failed to verify transaction with payment engine`,
        error
      );
      const status = error.response.status;
      const message = error.response.data;
      this.errorService.error({ message }, status);
    }
  }
}
