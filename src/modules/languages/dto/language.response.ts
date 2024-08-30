import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class GetLanguagesResponse {
  @Field(() => String, { nullable: true })
  _id: string;

  @Field(() => String, { nullable: true })
  language: string;

  @Field(() => Date, { nullable: true })
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  updatedAt: Date;
}
