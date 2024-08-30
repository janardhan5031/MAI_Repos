import { s3HrlperService } from "../helper/s3-helper/get-s3Client";
import { failureResponse, successResponse } from "../response/service";
import { Request, Response } from "express";

export class AwsS3Controller {
  private s3HelperService = new s3HrlperService();

  public async listAllFilesInBucket(req: Request, res: Response) {
    try {
      const s3Client = this.s3HelperService.getS3Client(req.body);
      const allFiles = await this.s3HelperService.listAllFilesInBucket(
        s3Client,
        req.body.bucketName
      );
      successResponse("success", { files: allFiles }, res, req);
    } catch (error: any) {
      failureResponse(error.message, error, res, req);
    }
  }

  public async getFileMetadata(req: Request, res: Response) {
    try {
      const s3Client = await this.s3HelperService.getS3Client(req.body);

      if (!req.body.keyName)
        failureResponse("keyName is required", {}, res, req);

      const fileMetadata = await this.s3HelperService.getFileMetadata(
        s3Client,
        req.body.bucketName,
        req.body.keyName
      );
      successResponse("success", { file: fileMetadata }, res, req);
    } catch (error: any) {
      failureResponse(error.message, error, res, req);
    }
  }

  public async getFileFromS3(req: Request, res: Response) {
    try {
      const s3Client = this.s3HelperService.getS3Client(req.body);

      if (!req.body.keyName)
        failureResponse("keyName is required", {}, res, req);

      if (!req.body.userId) {
        failureResponse("UserId is required", {}, res, req);
      } else {
        const resultStatus = await this.s3HelperService.getFileFromS3(
          s3Client,
          req.body.bucketName,
          req.body.keyName,
          req.body.userId
        );
        console.log("sending response");
        successResponse("success", resultStatus, res, req);
      }
    } catch (error: any) {
      failureResponse(error.message, error, res, req);
    }
  }
}
