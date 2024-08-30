import { Context, Query, Resolver } from "@nestjs/graphql";
import { EventCategoryService } from "./categories.service";
import { GetEventCategoriesResponse } from "./dto/categories.response";

@Resolver()
export class EventCategoryResolver {
  constructor(private readonly eventCategoryService: EventCategoryService) {}

  @Query(() => [GetEventCategoriesResponse])
  async getEventCategories(@Context() context: any) {
    return await this.eventCategoryService.getEventCategories(
      context.req.loginResponse
    );
  }
}
