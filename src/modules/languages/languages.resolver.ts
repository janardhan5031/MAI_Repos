import { Query, Resolver } from "@nestjs/graphql";
import { LanguageService } from "./languages.service";
import { GetLanguagesResponse } from "./dto/language.response";

@Resolver()
export class LanguageResolver {
  constructor(private readonly languageService: LanguageService) {}

  @Query(() => [GetLanguagesResponse])
  async getLanguages() {
    return await this.languageService.getLanguages();
  }
}
