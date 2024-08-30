import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class AddEventCategoryInput {
  @Field(() => String)
  eventCategory: string;
}
