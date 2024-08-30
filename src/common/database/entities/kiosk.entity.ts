import { Field } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Event } from "./events.entity";
import { Venue } from "./meta/venue.entity";
import { Transmute } from "./meta/common.entitty";
import { MetaProduct } from "./metaProducts.entity";

@Schema()
export class Kiosk {
  @Prop(() => String)
  name?: string;

  @Prop(() => Transmute)
  transmute?: Transmute;

  @Prop({ type: Types.ObjectId, ref: "MetaBanner" })
  banners?: string[];

  @Prop({ type: Types.ObjectId, ref: "Ownership" })
  owner?: string;

  @Prop({ type: Types.ObjectId, ref: "Event" })
  event: string;


  @Prop({ type: Types.ObjectId, ref: "Vendor" })
  vendor: string;

  @Prop({ type: Types.ObjectId, ref: "metakiosks" })
  metaKiosk: string;


  @Prop(() => [MetaProduct])
  products?: MetaProduct[];

  @Prop(() => String)
  thumbnailUrl?: string;

  @Prop(() => String)
  dimensions?: string;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({ default: new Date() })
  createdAt: Date;

  @Prop({})
  updatedAt: Date;
}

export const KioskSchema = SchemaFactory.createForClass(Kiosk);
