import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AdvertiserDetailsResponse {
  @Field(() => Boolean)
  isOk: boolean;

  @Field(() => String, { nullable: true })
  message: string;
}

@ObjectType()
export class AdvertiserResponse {
  @Field(() => String)
  _id: string;

  @Field(() => String, { nullable: true })
  orgName: string;

  @Field(() => String, { nullable: true })
  userId: string;

  @Field(() => Boolean, { nullable: true })
  isKYCVerified: boolean;
}

@ObjectType()
export class AdvertiserEventDetails {
  @Field(() => [AdvertiserResponse], { nullable: true })
  data: AdvertiserResponse[];

  @Field(() => Number, { nullable: true })
  total: number;

  @Field(() => Number, { nullable: true })
  filtered: number;
}
