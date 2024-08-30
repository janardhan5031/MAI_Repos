export class Errors {

    public static errorMessage(message: string, httpStatus: number, customErrorNumber: number) {
        return {
            message: message,
            httpStatus: httpStatus,
            customErrorNumber: customErrorNumber,
        }
    }

    public static systemError: any = {
        notFound: {
            timestamp: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            message: "Not Found",
            httpStatus: 404,
            customErrorNumber: -1000000,
            invalidRequestFormat: Errors.errorMessage("Invalid Request Format", 400, -999999),
            invalidRequest: Errors.errorMessage("Invalid Request", 401, 0),
            oopsSomethingWentWrong: Errors.errorMessage("Oops! Something went wrong", 500, -1),
            externalProviderIssue: Errors.errorMessage("Please try in some time!", 401, -2),
            invalidDetail: Errors.errorMessage("Invalid details", 401, -3),
            keyNotFound: Errors.errorMessage("Key not found in Redis", 404, -4),
            insufficientBalance: Errors.errorMessage("Insufficient Funds. Try after sometime!", 500, -5)
        }
    } // -1000000 to 99999
    
    public static externalErrors: any = {
   
    invalidSignature: Errors.errorMessage("Invalid Signature", 400, 200014),
    }
    
}