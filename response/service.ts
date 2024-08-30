import { Response } from 'express';
import { Errors } from '../constants';
import { response_status_codes } from './model';

export async function successResponse(message: string, result: any, res: Response, req: any) {

    res.status(response_status_codes.success).json({
        status: 'SUCCESS',
        message: message,
        result
    });
}

export async function failureResponse(message: string, result: any, res: Response, req: any) {
   
    res.status(response_status_codes.bad_request).json({
        status: 'FAILURE',
        message: message,
        result
    });
}

export async function validationError(validationError: any, res: any) {
    // Get Validation Errors
    let meta: any = {}
    let message: any
    let result: any
    meta['validationErrors'] = []
    for (let i in validationError) {
        meta['validationErrors'].push(validationError[i]['stack'])
    }
    // Create Exception
    message = Errors.systemError.notFound.invalidRequestFormat
    if (process.env.ENVIORNMENT != "production") result = meta
    res.status(response_status_codes.bad_request).json({
        status: 'FAILURE',
        message: message.message,
        customErrorNumber: message.customErrorNumber,
        result: result
    });
}

