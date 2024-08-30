import { ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { KYC_STATUS } from "src/common/config/constants";

@Schema()
export class Vendor {
  @Prop({ type: String })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String })
  orgName: string;

  @Prop({ type: String })
  userId: string;

  @Prop({ type: String })
  orgId: string;

  @Prop({ type: String })
  organizer: string;

  @Prop({ type: Boolean, default: false })
  isEmailVerified: boolean;

  @Prop({ type: Boolean, default: false })
  isKYCVerified: boolean;

  @Prop({ type: String, default: KYC_STATUS.PENDING })
  kycStatus: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
