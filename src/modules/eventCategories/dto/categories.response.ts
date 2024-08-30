import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class GetEventCategoriesResponse {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  eventCategory: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
