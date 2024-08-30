import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AvatarService } from "./Avatar.service";
import { NewEntryResponse } from "src/common/shared/common.responses";
import { ERROR_MESSAGES, REGEX } from "src/common/config/constants";
import { isValidObjectId } from "mongoose";
import { LoggingService } from "src/common/logging/logging.service";
import { GetEventAvatarResponse } from "./dto/avatar.response";

@Resolver()
export class AvatarResolver {
  constructor(private readonly avatarService: AvatarService) {}

  @Mutation(() => NewEntryResponse)
  async eventCustomAvatar(
    @Args("customAvatarUrl") customAvatarUrl: String,
    @Args("eventId") eventId: string,
    @Context() context: any
  ) {
    try {
      const splits = customAvatarUrl.split("/");

      const key = splits.pop();

      if (!customAvatarUrl || !key) {
        return new Error(ERROR_MESSAGES.INVALID_AVATAR);
      }
      if (!eventId || !isValidObjectId(eventId)) {
        return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
      }

      return await this.avatarService.eventCustomAvatar(
        context.req.loginResponse,
        customAvatarUrl,
        eventId
      );
    } catch (error) {
      LoggingService.error("AVATAR_RESOLVER_ERROR", { error });
      return new Error(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
    }
  }

  @Query(() => GetEventAvatarResponse)
  async getEventAvatar(
    @Args("eventId") eventId: string,
    @Context() context: any
  ) {
    try {
      if (!eventId || !isValidObjectId(eventId)) {
        return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
      }

      return await this.avatarService.getEventAvatar(
        context.req.loginResponse,
        eventId
      );
    } catch (error) {
      LoggingService.error("AVATAR_RESOLVER_ERROR", { error });
      return new Error(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
    }
  }
}
