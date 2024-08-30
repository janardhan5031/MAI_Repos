import axios from "axios";
import { HttpStatus, Injectable } from "@nestjs/common";
import { LoggingService } from "../logging/logging.service";
import { ErrorService } from "./errorService";
import {
  ChanePasswordInput,
  RegisterVendor,
} from "src/modules/auth/dto/auth.input_types";
import { addArtistInput } from "src/modules/artist/dto/artist.input_types";
import { ConfigurationService } from "../config/config.service";
import {
  ERROR_MESSAGES,
  LOG_MESSAGES,
  ROLES,
  SUCCESS_MESSAGE,
} from "../config/constants";

@Injectable()
export class AttendeesService {

  constructor(
    private readonly errorService: ErrorService,
    private readonly logginServicer: LoggingService,
    private readonly config: ConfigurationService
  ) {

  }

  async createPrivateTicket(event: any, eventData: any) {
    try {
      const createPrivateTicketInput = eventData
        .map((ticket: any) => `{
    email: "${ticket.email}",
    seatNumber: ${ticket.seatNumber ? `"${ticket.seatNumber}"` : null},
    type: ${ticket.type ? `"${ticket.type}"` : null},
  }`).join(', ');

      const mutation = `
  mutation {
    createPrivateTicket(
      eventId: "${event._id}",
      createPrivateTicket: [${createPrivateTicketInput}]
    )
  }
`
      // Create data object for the request
      let data = JSON.stringify({
        query: mutation,
        variables: {}
      });

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url:`${process.env.ATTENDEE_BACKEND_URL}/graphql`,
        headers: {
          'y-client-secret': `${process.env.PEM_CLIENT_SECRET}`,
          'Content-Type': 'application/json'
        },
        data: data
      };

      let response: any = await axios.request(config);

      return response.data;
    } catch (error) {
      this.logginServicer.error(
        LOG_MESSAGES.ERROR_CREATING_PRIVATE_TICKET,
        error
      );

      const errorCode = error?.response?.data?.statusCode || 400;
      this.errorService.error({ message: error }, errorCode);
    }
  }
}
