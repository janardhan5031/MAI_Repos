import { Args, Context, Mutation, Resolver, Query } from "@nestjs/graphql";
import { VendorService } from "./vendor.service";
import {
  GetVendorDetailsResponse,
  AssignKioskResponse,
  GetKiosksResponse,
  getEventsVendor,
} from "./dto/vendor.response";
import { assignKioskInputType } from "./dto/vendor.input_types";
import JSON from "graphql-type-json";
import { PaginationInput } from "src/common/shared/common.input_type";
import { isValidObjectId } from "mongoose";
import { ERROR_MESSAGES } from "src/common/config/constants";

@Resolver()
export class VendorResolver {
  constructor(
    private readonly vendorService: VendorService,
  ) {}

  @Query(() => GetVendorDetailsResponse)
  async getVendorsDetails(
    @Args("organizationName") organizationName: string,
    @Args("eventId") eventId: string,
    @Context() context: any
  ) {
    if (!eventId || !/^[0-9a-fA-F]{24}$/.test(eventId)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.vendorService.getVendors(
      organizationName,
      eventId,
      context.req.loginResponse
    );
  }

  @Query(() => JSON)
  async getVendorKiosks(
    @Args("eventId") eventId: string,
    @Args("vendorId") vendorId: string,
    @Context() context: any
  ) {
    return await this.vendorService.getVendorsKisosks(
      eventId,
      vendorId,
      context.req.loginResponse
    );
  }

  @Query(() => GetKiosksResponse)
  async getKioskDetails(
    @Args("eventId") eventid: String,
    @Context() context: any
  ) {
    if (!isValidObjectId(eventid)) {
      return new Error(ERROR_MESSAGES.INVALID_EVENT_ID);
    }
    return await this.vendorService.getKiosks(
      eventid,
      context.req.loginResponse
    );
  }

  @Mutation(() => AssignKioskResponse)
  async assignKiosks(
    @Args("input") input: assignKioskInputType,
    @Context() context: any
  ) {
    if(!input.kioskIds.length){
      throw new Error(ERROR_MESSAGES.KIOSKS_CANNOT_BE_EMPTY);
    }
    if (!!input.kioskIds || input.kioskIds) {
      const uniqueKiosks = new Set();

      for (const Kiosk of input.kioskIds) {
        // Check for empty strings
        if (!Kiosk || !/^[0-9a-fA-F]{24}$/.test(Kiosk)) {
          return new Error(ERROR_MESSAGES.INVALID_KIOSK_IN_ARRAY);
        }
        // Check for duplicate values
        if (uniqueKiosks.has(Kiosk)) {
          throw new Error(`${ERROR_MESSAGES.DUPLICATE_KIOSK_FOUND} : ${Kiosk}`);
        }
        uniqueKiosks.add(Kiosk);
      }
    }
    return await this.vendorService.assignKiosk(
      input,
      context.req.loginResponse,
      context.req.userTimeZone
    );
  }

  @Mutation(() => AssignKioskResponse)
  async deleteVendor(
    @Args("eventId") eventId: string,
    @Args("vendorId") vendorId: string,
    @Context() context: any
  ) {
    return await this.vendorService.deleteVendor(
      eventId,
      vendorId,
      context.req.loginResponse,
      context.req.userTimeZone
    );
  }

  @Query(() => getEventsVendor)
  async getEventVendors(
    @Args("eventId") eventId: string,
    @Args("paginationInput") paginationInput: PaginationInput,
    @Context() context: any
  ) {
    return await this.vendorService.getEventVendors(
      eventId,
      paginationInput,
      context.req.loginResponse
    );
  }
}
