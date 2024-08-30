import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class vendorDetailsResponse {
  @Field(() => String)
  _id: string;

  @Field(() => String)
  orgName: string;

}

@ObjectType()
export class GetVendorDetailsResponse {

  @Field(() => [VendorDetails])
  response: VendorDetails[];
}


@ObjectType()
export default class VendorDetails {

  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => String, { nullable: true })
  orgName?: string;

  @Field(() => String, { nullable: true })
  name?: string

  @Field(() => Boolean, { nullable: true })
  isKYCVerified?: boolean;

  @Field(() => [String], { nullable: true })
  kisoks?: string[];

}


@ObjectType()
export  class VendorEventDetails{

  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => String, { nullable: true })
  orgName?: string;

   
  @Field(() => Boolean, { nullable: true })
  isKYCVerified?: boolean;

  @Field(() => [KioskDetails], { nullable: true })
  kiosksList?: KioskDetails[];
}

@ObjectType()
export class DeleteVendorResponse {

  @Field(() => Boolean)
  isOk: boolean;

  @Field(() => String)
  message: string;
}


@ObjectType()
export class VendorResponse {
  @Field(() => [GetVendorDetailsResponse])
  data: GetVendorDetailsResponse[];

  @Field(() => Number, { nullable: true })
  total?: number;

  @Field(() => Number, { nullable: true })
  filtered?: number;

}

@ObjectType()
export class KioskDetails {

  @Field(() => String, { nullable: true })
  kioskName?: string;

  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => String, { nullable: true })
  thumbnailUrl?: string;

  @Field(() => String, { nullable: true })
  dimensions?: string;

}

@ObjectType()
export class getEventsVendor {

  @Field(() => String, { nullable: true })
  vendorsCount?: string;

  @Field(() => [VendorEventDetails], { nullable: true })
  vendors?: VendorEventDetails[];


}

@ObjectType()
export class GetKiosksResponse {

  @Field(() => [KioskDetails])
  kioskDetails: KioskDetails;

}

@ObjectType()
export class AssignKioskResponse {

  @Field(() => Boolean, { nullable: true })
  isOk?: boolean;

  @Field(() => String, { nullable: true })
  message?: string;

  @Field(() => String, { nullable: true })
  _id?: string;

  @Field(() => String, { nullable: true })
  createdBy?: string;

  @Field(() => String, { nullable: true })
  updatedBy?: string;

  @Field(() => [String], { nullable: true })
  activeKiosks?: string[];

  @Field(() => [String], { nullable: true })
  inActiveKiosks?: string[];

  @Field(() => String, { nullable: true })
  event?: string;

  @Field(() => String, { nullable: true })
  venue?: string;

  @Field(() => VendorDetails, { nullable: true })
  vendor?: VendorDetails;

}
