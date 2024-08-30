import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from "class-validator";
import { isValidObjectId } from "mongoose";
import { ERROR_MESSAGES, REGEX } from "../config/constants";
@ValidatorConstraint({ name: "customText", async: false })
export class IsValidEmail implements ValidatorConstraintInterface {
  validate(email: string, args: ValidationArguments) {
    const emailRegex = new RegExp(REGEX.VALIDATE_EMAIL);
    return emailRegex.test(email);
  }

  defaultMessage(args: ValidationArguments) {
    // here you can provide default error message if validation failed
    return ERROR_MESSAGES.INVALID_EMAIL;
  }
}
@ValidatorConstraint({ name: "customText", async: false })
export class HaveMiddleSpaces implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    text = text.trim();
    const regex = REGEX.MIDDLE_SPACES;
    return regex.test(text);
  }

  defaultMessage(args: ValidationArguments) {
    // here you can provide default error message if validation failed
    return ERROR_MESSAGES.INVALID_EMAIL;
  }
}
@ValidatorConstraint({ name: "customText", async: false })
export class HaveFrontAndBackSpaces implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    if ((text.length > 3 && text[0] == " ") || text[text.length - 1] == " ") {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    // here you can provide default error message if validation failed
    return ERROR_MESSAGES.INVALID_EMAIL;
  }
}
@ValidatorConstraint({ name: "customText", async: false })
export class IsValidDate implements ValidatorConstraintInterface {
  validate(dateString: string, args: ValidationArguments) {
    const dateObject = new Date(dateString);

    // Check if the dateObject is not 'Invalid Date' and the input string matches the dateObject's string representation
    const res = !isNaN(dateObject.getTime());
    return res;
  }
  defaultMessage(args: ValidationArguments) {
    // here you can provide default error message if validation failed
    return ERROR_MESSAGES.INVALID_DATE;
  }
}
@ValidatorConstraint({ name: "customText", async: false })
export class RemoveWhiteSpaces implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    return typeof text === "string" && text.trim().length > 0;
  }
  defaultMessage(args: ValidationArguments) {
    // here you can provide default error message if validation failed
    return ERROR_MESSAGES.SHORT_VALUE_ERROR;
  }
}
@ValidatorConstraint({ name: "customText", async: false })
export class CheckStringArray implements ValidatorConstraintInterface {
  validate(array: [string], args: ValidationArguments) {
    const middleSpaces = /\s/;

    if (!array) return false;

    for (let value of array) {
      if (value.trim().length == 0) {
        return false;
      } else if (middleSpaces.test(value)) {
        return false;
      } else if (value.length < 3) return false;
    }
    return true;
  }
  defaultMessage(args: ValidationArguments) {
    // here you can provide default error message if validation failed
    return ERROR_MESSAGES.SHORT_VALUE_ERROR;
  }
}

@ValidatorConstraint({ name: "frontAndBackSpaces", async: false })
export class FrontAndBackSpacesAndSpecialSymbols
  implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (typeof value !== "string") {
      // If the value is not a string, return false (not an error, but invalid)
      return false;
    }
    // Check if the value contains only letters (A-Z or a-z) and middle spaces
    const middleSpacesRegex = REGEX.ALPHA_NUMERIC;
    return middleSpacesRegex.test(value);
  }

  defaultMessage(_args: ValidationArguments) {
    return ERROR_MESSAGES.SHORT_VALUE_ERROR;
  }
}

@ValidatorConstraint({ name: "descriptionValidator", async: false })
export class AcceptPunctuationAndAlphaNumericCharacters
  implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (typeof value !== "string") {
      // If the value is not a string, return false (not an error, but invalid)
      return false;
    }
    // Check if the value contains only letters (A-Z or a-z), alphanumeric characters,
    // and special punctuation characters (allowed_chars).
    const allowed_chars = REGEX.ALLOWED_CHARS;
    const middleSpacesRegex = REGEX.CHARACTER_MIDDLE_SPACES;
    return middleSpacesRegex.test(value) && allowed_chars.test(value);
  }

  defaultMessage(_args: ValidationArguments) {
    return ERROR_MESSAGES.ACCEPT_PUNCTUATION_ERROR;
  }
}

@ValidatorConstraint({ name: "customText", async: false })
export class CheckIsNumber implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    if (!text) return true;

    return Number.isNaN(Number(text)) === false;
  }
  defaultMessage(args: ValidationArguments) {
    // here you can provide default error message if validation failed
    return ERROR_MESSAGES.INVALID_NUMBER;
  }
}
@ValidatorConstraint({ name: "customText", async: false })
export class IsWholeNumber implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    if (!text) return true;
    return Number.isInteger(text);
  }
  defaultMessage(args: ValidationArguments) {
    // here you can provide default error message if validation failed
    return ERROR_MESSAGES.INVALID_NUMBER;
  }
}
@ValidatorConstraint({ name: "specialCharsOnly", async: false })
export class HasNumbers implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const allowed_chars = REGEX.ALLOWED_CHARS_VALUE;
    return !allowed_chars.test(value);
  }
  defaultMessage(args: ValidationArguments) {
    const allowedChars = args?.constraints[0];
    return ERROR_MESSAGES.INVALID_NUMBER;
  }
}

@ValidatorConstraint({ name: "specialCharsOnly", async: false })
export class ValidatePassword implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const pattern = new RegExp(REGEX.PASSWORD);
    return pattern.test(value);
  }
  defaultMessage(args: ValidationArguments) {
    const allowedChars = args?.constraints[0];
    return `Invalid characters found. Only ${allowedChars.join(
      ", "
    )} are allowed.`;
  }
}

export function IsObjectId(validationOptions?: ValidationOptions) {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: "isObjectId",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          // Implement your custom validation logic here
          // Return true if the value is a valid ObjectId, or false otherwise
          // You can also customize the error message here
          return isValidObjectId(value); // Replace with your validation function
        },
      },
    });
  };
}

@ValidatorConstraint({ name: "specialCharsOnly" })
export class IsValidTime implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (/:/.test(value) == false) {
      return false;
    }

    const [hours, minutes] = value.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return false;
    if (
      hours > 22 ||
      hours < 0 ||
      minutes < 0 ||
      minutes >= 60 ||
      (hours == 22 && minutes > 0)
    )
      return false;
    return true;
  }
  defaultMessage(args: ValidationArguments) {
    const allowedChars = args?.constraints[0];
    return ERROR_MESSAGES.INVALID_NUMBER;
  }
}

@ValidatorConstraint({ name: "specialCharsOnly" })
export class IsValidSlotTime implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (/:/.test(value) == false) {
      return false;
    }

    const [hours, minutes] = value.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return false;
    if (
      hours > 22 ||
      hours < 0 ||
     ( minutes != 0 && minutes != 15 &&  minutes != 30 &&  minutes != 45 )|| 
      (hours == 22 && minutes > 0)
    )
      return false;
    return true;
  }
  defaultMessage(args: ValidationArguments) {
    const allowedChars = args?.constraints[0];
    return ERROR_MESSAGES.INVALID_NUMBER;
  }
}


@ValidatorConstraint({ name: "specialCharsOnly" })
export class IsValidsaleStartTime implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (/:/.test(value) == false) {
      return false;
    }

    const [hours, minutes] = value.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return false;
    if (
      hours > 23 ||
      hours < 0 ||
      minutes < 0 ||
      minutes >= 60
    )
      return false;
    return true;
  }
  defaultMessage(args: ValidationArguments) {
    const allowedChars = args?.constraints[0];
    return ERROR_MESSAGES.INVALID_NUMBER;
  }
}

@ValidatorConstraint({ name: "specialCharsOnly" })
export class IsValidDates implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const isHyphenFormat = /-/.test(value);
    if (!isHyphenFormat && !/\//.test(value)) {
      return false;
    }
    const separator = isHyphenFormat ? "-" : "/";
    const [year, month, day] = value.split(separator).map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
    if (year < 0 || month < 0 || day < 0 || month >= 13 || day >= 32) return false;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > lastDayOfMonth) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return ERROR_MESSAGES.INVALID_NUMBER;
  }
}


@ValidatorConstraint({ name: "specialCharsOnly" })
export class IsValidendTime implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (/:/.test(value) == false) {
      return false;
    }

    const [hours, minutes] = value.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return false;
    if (
      hours > 23 ||
      hours < 0 ||
      minutes < 0 ||
      minutes >= 60 ||
      (hours == 23 && minutes > 0)
    )
      return false;
    return true;
  }
  defaultMessage(args: ValidationArguments) {
    const allowedChars = args?.constraints[0];
    return ERROR_MESSAGES.INVALID_NUMBER;
  }
}
@ValidatorConstraint({ name: "specialCharsOnly" })
export class IsValidSlotendTime implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (/:/.test(value) == false) {
      return false;
    }

    const [hours, minutes] = value.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return false;
    if (
      hours > 23 ||
      hours < 0 ||
      ( minutes != 0 && minutes != 15 &&  minutes != 30 &&  minutes != 45 )|| 
      (hours == 23 && minutes > 0)
    )
      return false;
    return true;
  }
  defaultMessage(args: ValidationArguments) {
    const allowedChars = args?.constraints[0];
    return ERROR_MESSAGES.INVALID_NUMBER;
  }
}

@ValidatorConstraint({ name: "isNameFormat", async: false })
export class IsNameFormatConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    // Regular expression to check if the value contains only alphabetic characters and spaces
    return REGEX.ALPHA_NUMERIC.test(value);
  }
}

export function IsNameFormat(customMessage?: string) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: customMessage || ERROR_MESSAGES.INVALID_NUMBER,
      },
      constraints: [],
      validator: IsNameFormatConstraint,
    });
  };
}

export function IsZipcode(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: "isZipcode",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") {
            return false;
          }

          // Remove leading and trailing spaces
          value = value.trim();

          // Check if the value is a 6-digit number
          return REGEX.SIX_DIGIT_VALUE.test(value);
        },
      },
    });
  };
}

export function IsOrgName(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: "IsOrgName",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== "string") {
            return false;
          }

          // Remove leading and trailing spaces
          value = value.trim();

          // Check if the value is a 6-digit number
          return REGEX.SIX_DIGIT_VALUE.test(value);
        },
      },
    });
  };
}

@ValidatorConstraint({ name: "uniqueArray", async: false })
export class UniqueArrayConstraint implements ValidatorConstraintInterface {
  validate(array: any[], args: any) {
    if (!Array.isArray(array) || array.length === 0) {
      return false; // Non-array or empty array, return false
    }

    if (array.length) {
      array.filter((trackId) => {
        trackId = trackId.trim();
        if (!isValidObjectId(trackId)) {
          return false;
        } else {
          return isValidObjectId(trackId);
        }
      });
    }

    return array.every((value, index, self) => self.indexOf(value) === index);
  }

  defaultMessage() {
    return ERROR_MESSAGES.ARRAY_UNIQUE_ELEMENTS_ERROR;
  }
}
