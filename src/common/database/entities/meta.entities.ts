import { Field } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

class Transform {
  @Prop({ type: Object })
  position: {
    x: number;
    y: number;
    z: number;
  };

  @Prop({ type: Object })
  rotation: {
    x: number;
    y: number;
    z: number;
  };

  @Prop({ type: Object })
  scale: {
    x: number;
    y: number;
    z: number;
  };
}

export class Props {
  @Prop()
  @Field(() => String)
  category: string;

  @Prop()
  @Field(() => String)
  name: string;

  @Prop()
  @Field(() => Transform)
  transform: Transform;

  @Prop()
  @Field(() => String)
  mediaLink: string;
}

export const PropsSchema = SchemaFactory.createForClass(Props);
