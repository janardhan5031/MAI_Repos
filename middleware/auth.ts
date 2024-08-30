import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import { ResponseHelper } from "../common/error.service";
import { AxiosService } from "../service/axios.service";

export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.header("Authorization");

    if (!token) {
      // Return 401 if token is missing
      return ResponseHelper.failureResponse(
        "Authorization token is missing",
        null,
        res,
        401
      );
    }

    const config = {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    };

    // Call to the auth to validate the user
    const response = await AxiosService.get(
      `${process.env.AUTH_URL}/user/profile`,
      res,
      config
    );

    //store the user information in the header
    req["user"] = response.data;
    // Call the next function to proceed with the request
    next();
  } catch (error) {
    ResponseHelper.failureResponse(
      error?.response?.data?.message
        ? error?.response?.data?.message
        : "An error occurred",
      null,
      res,
      error?.response?.data?.status ? error?.response?.data?.status : 500
    );
  }
}
