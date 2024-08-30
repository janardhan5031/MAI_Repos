import { Field, InputType, Int, registerEnumType } from "@nestjs/graphql";

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  skip?: number;

}

@InputType()
export class DurationInput {
  @Field(() => Date, { nullable: true })
  fromDate: Date;

  @Field(() => Date, { nullable: true })
  toDate: Date;
}
enum EventStatus {
  DRAFT = "DRAFT",
  UNPUBLISHED = "UNPUBLISHED",
  PUBLISHED = "PUBLISHED",
  COMPLETED = "COMPLETED",
  LIVE = "LIVE",
  CANCELLED = "CANCELLED",
  UPCOMING = "UPCOMING",
}
registerEnumType(EventStatus, { name: "EventStatus" });
@InputType()
export class Input {
  @Field(() => EventStatus)
  status: EventStatus;
}

@InputType()
export class EventsFilterInput extends Input {
  @Field(() => String, { nullable: true })
  name?: string;
}
