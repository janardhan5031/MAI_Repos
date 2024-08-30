import { Response } from "express";
import "dotenv/config";

export class ResponseHelper {
  public static sendResponse(
    status: string,
    message: string,
    statusCode: number,
    result: any,
    res: Response
  ) {
    if (!res.headersSent) {
      res.status(statusCode).json({
        status,
        message,
        result,
      });
    }
  }

  public static successResponse(
    message: string = "",
    result: any = null,
    res: Response,
    statusCode: number = 200
  ) {
    this.sendResponse("SUCCESS", message, statusCode, result, res);
  }

  public static failureResponse(
    message: string = "",
    result: any = null,
    res: Response,
    statusCode: number = 400
  ) {
    this.sendResponse("FAILURE", message, statusCode, result, res);
  }

  public static errorResponse(
    message: string = "",
    statusCode: number = 500,
    res: Response
  ) {
    this.sendResponse("FAILURE", message, statusCode, null, res);
  }
}
