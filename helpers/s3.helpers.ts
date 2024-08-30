const PDFDocument = require("pdfkit");
import * as fs from "fs";
const AWS = require("aws-sdk");
const qr = require("qrcode");
import "dotenv/config";
import loggerInstance from "../config/winston";

export class S3Helper {
  //uploading the certificate to s3
  public static async uploadFile(mintedData: any, req: any) {
    try {
      let link;
      const user = req.user.result;
      const file = fs.readFileSync(
        `certificate/Myipr-certificate-${user.username}_${mintedData.txId.slice(
          -6
        )}.pdf`
      );

      const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION,
      });

      const params = {
        Key: `${user.username}/Myipr-certificate-${
          user.username
        }_${mintedData.txId.slice(-6)}.pdf`,
        Body: file,
        Bucket: process.env.S3_BUCKET_NAME,
        ContentType: "application/pdf",
      };

      link = await new Promise((resolve, reject) => {
        s3.upload(params, function (s3Err: any, data: any) {
          if (s3Err) {
            loggerInstance.error("Error while uploading to s3", s3Err);
            reject(s3Err);
          }
          resolve(data.Location);
        });
      });
      loggerInstance.info("Certificate uploaded to s3", link);
      return link;
    } catch (error) {
      loggerInstance.error(
        "Error while uploading the certificate to s3",
        error
      );
      throw error;
    }
  }

  public static async findcertificateOnS3(certificate_link: any) {
    try {
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        // region: process.env.AWS_REGION,
      });

      const s3 = new AWS.S3();
      const parts = certificate_link.split('/');
      const key = parts.slice(3).join('/');
      
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: "attachment",
        Expires: 60, // Expiration time in seconds (1 hour in this example)
      };

      await s3.headObject({ Bucket: params.Bucket, Key: params.Key }).promise();

      const signedUrl = s3.getSignedUrl("getObject", params);
      loggerInstance.info("Successfully generated the download link");
      return signedUrl;
    } catch (error) {
      loggerInstance.error(
        "Error while generating the download link for the certificate",
        error
      );
      throw {
        statuscode: 404,
        message: "File Not Found "+certificate_link,
      };
    }
  }

  //link share certificate
  public static async findcertificatetoShare(certificate: any) {
    try {
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION,
      });

      const s3 = new AWS.S3();
      const parts = certificate.certificate_link.split('/');
      const key = parts.slice(1).join('/');

      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Expires: 31536000, // Expiration time in seconds (1 hour in this example)
      };

      await s3.headObject({ Bucket: params.Bucket, Key: params.Key }).promise();

      const signedUrl = s3.getSignedUrl("getObject", params);
      loggerInstance.info("Successfully generated the download link");
      return signedUrl;
    } catch (error) {
      loggerInstance.error(
        "Error while generating the download link for the certificate",
        error
      );
      throw {
        statuscode: 404,
        message: "File Not Found",
      };
    }
  }

  public static async deleteS3File(certificate: string) {
    try {
      const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION,
      });

      const parts = certificate.split('/');
      const key = parts.slice(1).join('/');
  
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      };
  
      return await s3.deleteObject(params).promise();
    
    } catch (error) {
      console.error('Error deleting file:', error);
      loggerInstance.error(
        "Error while deleting the file in s3",
        error
      );
      throw {
        statuscode: 404,
        message: "File Not Found",
      };
    }
  }
}
