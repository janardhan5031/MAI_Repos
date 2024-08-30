import { Field, ObjectType } from "@nestjs/graphql";
@ObjectType()
export class GetEventAvatarResponse {
  @Field(() => String, { nullable: true })
  eventId: string;

  @Field(() => String, { nullable: true })
  Url: string;

  @Field(() => Boolean, { nullable: true })
  isCustomAvatar: boolean;
}
