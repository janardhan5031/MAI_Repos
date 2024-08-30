import "dotenv/config";

export class InputValidator {
  public static validateString(
    input: string,
    fieldName: string,
    isRequired: boolean = false
  ) {
    if (
      isRequired &&
      (!input || typeof input !== "string" || input.trim().length === 0)
    ) {
      throw {
        statuscode: 401,
        message: `Invalid ${fieldName}. ${fieldName} is required and must be a non-empty string.`,
      };
    }
    if (
      !isRequired &&
      input &&
      (typeof input !== "string" || input.trim().length === 0)
    ) {
      throw {
        statuscode: 401,
        message: `Invalid ${fieldName}. ${fieldName} must be a non-empty string.`,
      };
    }
  }
}
