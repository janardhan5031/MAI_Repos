import { Injectable } from "@nestjs/common";
import { LoggingService } from "../logging/logging.service";
import { ErrorService } from "../services/errorService";
import { validate } from "class-validator";
import { LanguageIdValidation } from "src/modules/event/dto/event.input_type";
import { ERROR_MESSAGES, LOG_MESSAGES } from "../config/constants";

@Injectable()
export class InputManipulationService {
  constructor(
    private readonly logginService: LoggingService,
    private readonly errorService: ErrorService
  ) {}

  async removeSpaces(input: any, fields: string[]) {
    try {
      fields.forEach((field) => {
        if (input[field]) {
          const newData = input[field].replace(/\s+/g, " ").trim();
          input[field] = newData;
        }
      });

      return input;
    } catch (error) {
      this.logginService.error(LOG_MESSAGES.REMOVING_SPACES_ERROR, error);
      this.errorService.error({ message: error.message },400);
    }
  }

  async ValidateLanguages(input) {
    try {
      if (input?.languages) {
        for (let _id of input.languages) {
          const eventIdValidation = new LanguageIdValidation();
          eventIdValidation.languageId = _id;

          const errors = await validate(eventIdValidation, {
            skipMissingProperties: true,
          });
          if (errors.length > 0) {
            throw new Error(Object.values(errors[0]?.constraints)[0]);
          }
        }
      }
    } catch (error) {
      this.logginService.error(LOG_MESSAGES.VALIDATING_LANGUAGES_ERROR, error);
      this.errorService.error({ message: error.message },400);
    }
  }

  async stringValidation(input, field, min, max) {
    try {
      if (input[field]) {
        if (input[field].length > max || input[field].length < min) {
          throw new Error(
            `${field} should be in range of ${min}-${max} characters`
          );
        }
      }
    } catch (error) {
      this.logginService.error("Error while validating " + field, error);
      this.errorService.error({ message: error.message },400);
    }
  }
  async checkStringArray(input: any, fields: string[]) {
    try {
      const middleSpaces = /\s/;

      // check where the given field is exist or not
      fields.forEach((field) => {
        if (Array.isArray(input[field])) {
          const array = input[field];

          if (!array.length) {
            throw new Error(
              `${field} ${ERROR_MESSAGES.SPACES_CHARCTERS_ERROR}`
            );
          }

          array.forEach((value) => {
            let isError = false;
            if (value.trim().length == 0) {
              isError = true;
            } else if (middleSpaces.test(value)) {
              isError = true;
            } else if (value.length < 3) isError = true;

            if (isError) {
              this.errorService.error({
                message: `${field} ${ERROR_MESSAGES.SPACES_CHARCTERS_ERROR}`,
              },400);
            }
          });
        }
      });

      return input;
    } catch (error) {
      this.logginService.error(ERROR_MESSAGES.SPACES_CHARCTERS_ERROR, error);
      this.errorService.error({
        message: error.message,
      },400);
    }
  }
}
