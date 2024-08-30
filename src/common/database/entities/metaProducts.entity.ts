import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Transmute } from "./meta/common.entitty";
import { Vendor } from "./vendor.entity";

@Schema()
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({ required: true, default: false })
  isPublished: boolean;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;

  @Prop()
  deletedBy: string;

  @Prop({ default: new Date() })
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

@Schema()
export class MetaProduct {
  @Prop({ required: false })
  name: string;

  @Prop({ required: false })
  price: number;

  @Prop({ required: false })
  productUrl: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: false })
  thumbnailUrl: string;

  @Prop({ required: false, default: [] })
  images: [string];

  @Prop({ required: true, type: Types.ObjectId, ref: "Category" })
  category: Category;

  @Prop({ required: true, type: Types.ObjectId, ref: "Vendor" })
  vendor: Vendor;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({ required: false, default: new Date() })
  createdAt: Date;

  @Prop({ required: false, default: new Date() })
  updatedAt: Date;

  @Prop({ required: false, default: [] })
  tags: [string];

  @Prop({ required: false })
  transmute: Transmute;
}

export const MetaProductSchema = SchemaFactory.createForClass(MetaProduct);
export const CategorySchema = SchemaFactory.createForClass(Category);
