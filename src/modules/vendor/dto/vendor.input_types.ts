import { Field, InputType } from "@nestjs/graphql";
import { ERROR_MESSAGES } from "src/common/config/constants";
import { IsObjectId } from "src/common/shared/inputValidator";

@InputType()
export class assignKioskInputType {

    @Field(() => String)
    @IsObjectId({
        message: ERROR_MESSAGES.INVALID_EVENT_ID,
      })
    eventId: string;

    @Field(() => String,{nullable :true})
    @IsObjectId({
        message: ERROR_MESSAGES.INVALID_VENDOR_ID,
      })
    vendorId?: string;

    @Field(() => String,{nullable :true})
    venueId?: string;

    @Field(() => [String])
    kioskIds: string[];

}   
