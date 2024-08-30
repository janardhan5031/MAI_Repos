import { Field } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Languages {
  @Prop()
  @Field(() => String)
  language: string;

  @Prop({ default: false })
  @Field(() => Boolean)
  isDeleted: boolean;

  @Prop({
    default: new Date()
  })
  @Field(() => Date)
  createdAt: Date;

  @Prop()
  @Field(() => Date)
  updatedAt: Date;
}

export const LanguageSchema = SchemaFactory.createForClass(Languages);
