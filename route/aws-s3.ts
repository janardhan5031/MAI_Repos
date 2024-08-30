import { Application, Request, Response } from "express";
import { AwsS3Controller } from "../controller/aws-s3.controller";

export class AwsS3Routes {
  private awsS3Routes = new AwsS3Controller();

  public route(app: Application) {
    // Request Body
    // {
    //   "accessKeyId":"",
    //   "secretAccessKey":"",
    //   "region":"",
    //   "bucketName":""
    // }
    app.post("/v1/s3/get-files", (req: Request, res: Response) => {
      this.awsS3Routes.listAllFilesInBucket(req, res);
    });
    // Request Body
    // {
    //   "accessKeyId":"",
    //   "secretAccessKey":"",
    //   "region":"",
    //   "bucketName":"",
    //   "keyName":""
    // }
    app.post("/v1/s3/file-metadata", (req: Request, res: Response) => {
      this.awsS3Routes.getFileMetadata(req, res);
    });
    // Request Body
    // {
    //   "accessKeyId":"",
    //   "secretAccessKey":"",
    //   "region":"",
    //   "bucketName":"",
    //   "keyName":""
    // }
    app.post("/v1/s3/get-file", (req: Request, res: Response) => {
      this.awsS3Routes.getFileFromS3(req, res);
    });
  }
}
