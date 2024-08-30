import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Kiosk } from "./kiosk.entity";
import { Vendor } from "./vendor.entity";

@Schema()
export class VendorEvent {
  @Prop({ required: true, type: Types.ObjectId, default : [] , ref : "metakiosks" })
  activeKiosks: string[];

  @Prop({ required: true, type: Types.ObjectId, ref: "venues" })
  venue: string;

  @Prop({ required: true, type: Types.ObjectId, ref: "Events" })
  event: string;

  @Prop({ required: true, type: Types.ObjectId, ref : "Vnedors" })
  vendor: string;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  updatedBy: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: String })
  deletedBy: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}

export const VendorEventSchema = SchemaFactory.createForClass(VendorEvent);
VendorEventSchema.pre('save', function (next) {
  const uniqueValues = new Set(this.activeKiosks);

  if (uniqueValues.size !== this.activeKiosks.length) {
    const err = new Error('Duplicate values in activeKiosks array');
    next(err);
  } else {
    next();
  }
});