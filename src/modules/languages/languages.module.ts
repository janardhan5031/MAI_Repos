import { Module } from "@nestjs/common";
import { LanguageService } from "./languages.service";
import { LanguageResolver } from "./languages.resolver";
import { LoggingService } from "src/common/logging/logging.service";
import { LoggingModule } from "src/common/logging/logging.module";
import { MongooseModule } from "@nestjs/mongoose";
import {
  LanguageSchema,
  Languages,
} from "src/common/database/entities/languages";
import { ConfigurationModule } from "src/common/config/config.module";

@Module({
  imports: [
    ConfigurationModule,
    LoggingModule,
    MongooseModule.forFeature([
      { name: Languages.name, schema: LanguageSchema },
    ]),
  ],
  providers: [LanguageService, LanguageResolver, LoggingService],
  exports: [LanguageService],
})
export class LanguageModule {}
