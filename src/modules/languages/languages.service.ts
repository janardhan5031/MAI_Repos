import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ERROR_MESSAGES } from "src/common/config/constants";
import { Languages } from "src/common/database/entities/languages";
import { LoggingService } from "src/common/logging/logging.service";

@Injectable()
export class LanguageService {
  constructor(
    private readonly loggingService: LoggingService,
    @InjectModel(Languages.name)
    private readonly languageModel: Model<Languages>
  ) {}

  async getLanguages() {
    try {
      const languages = await this.languageModel.find();
      return languages;
    } catch (error) {
      this.loggingService.error(ERROR_MESSAGES.ERROR_RETRIEVE_LANGUGAES, error);
      return error;
    }
  }
}
