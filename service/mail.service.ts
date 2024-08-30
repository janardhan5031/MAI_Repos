const FormData = require("form-data");
import * as fs from "fs";
import "dotenv/config";
import { AxiosService } from "./axios.service";
import loggerInstance from "../config/winston";

export class MailService {
  public static async sendEmail(
    user: any,
    subject: string,
    message: string,
    emailType: string,
    category: string,
    file?: any
  ) {
    try {
      let formData = new FormData();
      formData.append("emailFrom", process.env.EMAIL_FROM_ADDRESS);
      formData.append("emailTo", user.email?user.email:user);
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("emailType", emailType);
      formData.append("category", category);
      {
        file ? formData.append("file", file?.file, file?.name) :{};
      }

      let config = {
        maxBodyLength: Infinity,
        headers: {
          serviceName: process.env.EMAIL_SERVICE_NAME,
          emailauthkey: process.env.EMAIL_AUTH_KEY,
          ...formData.getHeaders(),
          "Content-Type": "multipart/form-data",
        },
        data: formData,
      };

      await AxiosService.post(
        `${process.env.EMAIL_GATEWAY_URI}/send/attachemail`,
        formData,
        config
      );

      // Delete certificate from file directory after sending the certificate through email to user
      if (!fs.existsSync(`../certificate/${file?.name}`)) {
        fs.unlink(`certificate/${file?.name}`, (err) => {});
      }
     

      return { isEmailSent: true };
    } catch (error) {
      loggerInstance.error("Error while sending the mail", error);
    }
  }
}
