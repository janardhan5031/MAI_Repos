import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ERROR_MESSAGES } from "../config/constants";

@Injectable()
export class ErrorService {
  [x: string]: any;
  constructor() {}
  error(error, statusCode: number) {
    let message: any;
    let code = statusCode;
    if (error?.message?.response?.data?.message?.fieldErrors?.mobileNumber) {
      message = error.message.response.data.message.fieldErrors.mobileNumber[0];
      code = error.message.response.data.statusCode;
    } else if (error?.message?.response?.roles) {
       message = `Role - ${error?.message?.response?.roles[0]}`;
      statusCode = error.message?.status;
    } else if (error.message?.response?.data?.message?.orgName) {
      message = `orgNmae - ${error.message?.response?.data.message.orgName[0]}`;
      statusCode = error.message?.status
    } 
    else if (error.message?.response?.data?.message?.firstName) {
      message = `First Name - ${error.message?.response?.data.message.firstName[0]}`;
      statusCode = error.message?.response?.data.statusCode;
    } else if (error.message?.response?.data?.message?.lastName) {
      message =`Last Name - ${error.message?.response?.data.message.lastName[0]}`;
      statusCode = error.message?.response?.data.statusCode;
    } else if (error.message?.response?.data?.message?.password) {
      message = `password ${error.message?.response?.data.message.password[0]}`;
      statusCode = error.message?.response?.data.statusCode;
    } else if (error.message?.response?.data?.message?.countryCode) {
      message = error.message?.response?.data.message.countryCode[0];
      statusCode = error.message?.response?.data.statusCode;
    } else if (error.message?.response?.data?.message?.mobileNumber) {
      message = error.message?.response?.data.message.mobileNumber[0];
      statusCode = error.message?.response?.data.statusCode;
    } else if (error.message?.response?.data?.message?.email) {
      message = error.message?.response?.data.message.email[0];
      statusCode = error.message?.response?.data.statusCode;
    } else if (error.message?.response?.data?.message?.address) {
      message = error.message?.response?.data.message.address[0];
      statusCode = error.message?.response?.data.statusCode;
    } else if (error.message?.response?.data?.message?.state) {
      message = error.message?.response?.data.message.state[0];
      statusCode = error.message?.response?.data.statusCode;
    } else if (error.message?.response?.data?.message?.city) {
      message = error.message?.response?.data.message.city[0];
      statusCode = error.message?.response?.data.statusCode;
    } else if (error.message?.response?.data?.message?.country) {
      message = error.message?.response?.data.message.country[0];
      statusCode = error.message?.response?.data.statusCode;
    } else if (error.message?.response?.data?.message?.zipcode) {
      message = error.message?.response?.data.message.zipcode[0];
      statusCode = error.message?.response?.data.statusCode;
    } else if (error.message?.response?.data?.message?.description) {
      message = error.message?.response?.data.message.description[0];
      statusCode = error.message?.response?.data.statusCode;
    } else if (
      error?.message?.response?.data?.message?.errors?.fieldErrors?.error
    ) {
      message = error.message.response.data.message.errors.fieldErrors.error;
      code = error.message.response.data.statusCode;
    } else if (error?.message?.response?.data?.message?.fieldErrors?.error) {
      message = error.message.response.data.message.fieldErrors.error;
      code = error.message.response.data.statusCode;
    } else if (error.response?.data?.message?.fieldErrors?.error) {
      message = error.response.data.message.fieldErrors.error;
    } else if (error.response?.data?.message?.message) {
      message = error.response.data.message.message;
      code = error.response.data.statusCode;
    } else if (error?.message?.response?.data?.message?.feildErrors?.error) {
      message = error.message.response.data.message.feildErrors.error;
      code = error.message.response.data.statusCode;
    } else if (
      error?.message?.response?.data?.message?.errors?.fieldErrors?.password
    ) {
      message =
        error?.message?.response?.data?.message?.errors?.fieldErrors
          ?.password[0];
      code = error.message.response.data.message.statusCode;
    } else if (error?.message?.response?.data?.message?.fieldErrors?.email) {
      message = error.message.response.data.message.fieldErrors.email[0];
      code = error.message.response.data.statusCode;
    } else if (
      error?.message?.response?.data?.message?.fieldErrors?.mobileNumber
    ) {
      message = error.message.response.data.message.feildErrors.mobileNumber[0];
      code = error.message.response.data.statusCode;
    } else if (error?.message?.response?.data?.message?.fieldErrors?.password) {
      message = error.message.response.data.message.fieldErrors.password[0];
      code = error.message.response.data.statusCode;
    } else if (error?.message?.response?.data?.message?.fieldErrors?.fullName) {
      message = error.message.response.data.message.fieldErrors.fullName[0];
      code = error.message.response.data.statusCode;
    } else if (error?.message?.response?.data?.message?.fieldErrors?.address) {
      message = error.message.response.data.message.fieldErrors.address[0];
      code = error.message.response.data.statusCode;
    } else if (error?.message?.response?.data?.message?.message) {
      message =
        error.message.response.data.message?.message ||
        error.message.response.data.message?.code;
      code = error.message.response.data.statusCode;
    } else if (error?.message?.response?.data?.message) {
      message = error.message.response.data.message;
      code = error.message.response.data.statusCode;
    } else if (error?.response?.data?.message) {
      message = error.response.data.message;
      code = error.response.data.statusCode;
    } else if (
      error?.response &&
      error?.response?.data &&
      Array.isArray(error.response?.data?.message)
    ) {
      message = Object.values(error.response.data.message)[0][0];
      code = error.response.data.statusCode;
    } else if (error.message?.response && error.message.response?.data) {
      message = error.message.response.data;
    } else if (
      error.message?.response &&
      error.message.response?.data &&
      Object.values(error.message.response?.data?.message)[0]
    ) {
      message = Object.values(error.message.response.data.message)[0][0];
    } else if (error?.message?.response?.data) {
      message = error.message.response.data;
      code = error.message.response.data.statusCode;
    } else if (error.message?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
      code = statusCode;
    } else {
      message = ERROR_MESSAGES.SOMETHING_WENT_WRONG;
    }
    throw new HttpException(message, code);
  }
}
