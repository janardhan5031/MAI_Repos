import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PointResponse {
  @Field(() => Number, { nullable: true })
  x?: number;

  @Field(() => Number, { nullable: true })
  y?: number;
}
@ObjectType()
export class MediaResponse {
  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => String, { nullable: true })
  fileName?: string;

  @Field(() => String, { nullable: true })
  link?: string;

  @Field(() => String, { nullable: true })
  format?: string;

  @Field(() => PointResponse, { nullable: true })
  dimension?: PointResponse;

  @Field(() => String, { nullable: true })
  thumbnail?: string;

  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => Boolean, { nullable: true })
  isFavorite?: boolean;
}
@ObjectType()
export class GetGalleryResponse {
  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => String, { nullable: true })
  event?: string;

  @Field(() => String, { nullable: true })
  user?: string;

  @Field(() => [MediaResponse], { nullable: true })
  media?: MediaResponse[];

  @Field(() => String, { nullable: true })
  eventName?: string;
}
