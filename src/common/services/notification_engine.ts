import { Injectable } from "@nestjs/common";
import { ConfigurationService } from "../config/config.service";
import { LoggingService } from "../logging/logging.service";
import { ErrorService } from "./errorService";
import axios from "axios";
import { ERROR_MESSAGES, LOG_MESSAGES } from "../config/constants";
import { NotificationEngineService } from "./notificatioService";
const moment = require("moment");
const timeZone = require("moment-timezone");
const fs = require("fs");

@Injectable()
export class NotificationEngine {
  private WELCOME_ADVERTISER_EMAIL: string;
  private WELCOME_ARTIST_EMAIL: string;
  private ADVERTISER_ADDED_TO_EVENT: string;
  private ADVERTISER_EVENT_CANCELLED: string;
  private ARTIST_EVENT_CANCELLED: string;
  private ARTIST_ADDED_TO_EVENT: string;
  private ORGNAIZER_WELCOME_EVENT: string;
  private ORGANIZER_CANCEL_EVENT: string;
  private ORGANIZER_UPCOMING_EVENT: string;
  private VENDOR_ONBOARDED_TO_EVENT: string;
  private ADVERTISER_ONBOARDED_TO_EVENT: string;
  private ARTIST_ONBOARDED_TO_EVENT: string;
  private EVENT_CREATION_SUCCESS: string;
  private EVENT_TICKET_SALE_START: string;
  private ARTIST_UPCOMING_EVENT: string;
  private EVENT_TICKET_REQUEST: string;
  private CSV_INVITE_REQUEST: string;

  constructor(
    private readonly config: ConfigurationService,
    private readonly notificationService: NotificationEngineService,

    private readonly loggingService: LoggingService,
    private errorService: ErrorService
  ) {
    this.WELCOME_ADVERTISER_EMAIL = this.config.get("WELCOME_ADVERTISER_EMAIL");
    this.WELCOME_ARTIST_EMAIL = this.config.get("WELCOME_ARTIST_EMAIL");
    this.ADVERTISER_ADDED_TO_EVENT = this.config.get(
      "ADVERTISER_ADDED_TO_EVENT"
    );
    this.ARTIST_ADDED_TO_EVENT = this.config.get("ARTIST_ADDED_TO_EVENT");
    this.ADVERTISER_EVENT_CANCELLED = this.config.get(
      "ADVERTISER_EVENT_CANCELLED"
    );
    this.ARTIST_EVENT_CANCELLED = this.config.get("ARTIST_EVENT_CANCELLED");
    this.ORGNAIZER_WELCOME_EVENT = this.config.get("ORGNAIZER_WELCOME_EVENT");
    this.ORGANIZER_CANCEL_EVENT = this.config.get("ORGANIZER_CANCEL_EVENT");
    this.ORGANIZER_UPCOMING_EVENT = this.config.get("ORGANIZER_UPCOMING_EVENT");
    this.VENDOR_ONBOARDED_TO_EVENT = this.config.get(
      "VENDOR_ONBOARDED_TO_EVENT"
    );
    this.ADVERTISER_ONBOARDED_TO_EVENT = this.config.get(
      "ADVERTISER_ONBOARDED_TO_EVENT"
    );
    this.ARTIST_ONBOARDED_TO_EVENT = this.config.get(
      "ARTIST_ONBOARDED_TO_EVENT"
    );

    this.EVENT_CREATION_SUCCESS = this.config.get("EVENT_CREATION_SUCCESS");
    this.EVENT_TICKET_SALE_START = this.config.get("EVENT_TICKET_SALE_START");
    this.ARTIST_UPCOMING_EVENT = this.config.get("ARTIST_UPCOMING_EVENT");
    this.EVENT_TICKET_REQUEST = this.config.get("EVENT_TICKET_REQUEST");
    this.CSV_INVITE_REQUEST = this.config.get("CSV_INVITE_REQUEST");
  }

  async advertiserwelcomeEmail(
    advertiser: { userId: string; email: string },
    data: {
      advertiserName: string;
    }
  ) {
    try {

      this.loggingService.log(
        `${LOG_MESSAGES.WELCOME_ADVERTISER_EMAIL}` +
        JSON.stringify(advertiser) +
        " " +
        JSON.stringify(data)
      );
      data.advertiserName = data.advertiserName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();

      const body = {
        eventName: this.WELCOME_ADVERTISER_EMAIL,
        emailContent: {
          advertiserName: data.advertiserName,
        },
        receiverIds: [advertiser],
      };
      await this.notificationService.notification_call(body)
      this.loggingService.log(
        `${LOG_MESSAGES.EMAIL_SENT_SUCCESSFULLY} ${JSON.stringify(advertiser)}`
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      return error
    }
  }

  async artsitWelcomeEmail(
    artist: { userId: string; email: string },
    data: {
      ArtistName: string;
    }
  ) {
    try {

      this.loggingService.log(
        `${LOG_MESSAGES.WELCOME_ARTIST_EMAIL}` +
        JSON.stringify(artist) +
        " " +
        JSON.stringify(data)
      );
      data.ArtistName = data.ArtistName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      const body = {
        eventName: this.WELCOME_ARTIST_EMAIL,
        emailContent: {
          ArtistName: data.ArtistName,
        },
        receiverIds: [artist],
      };

      await this.notificationService.notification_call(body)
      this.loggingService.log(
        `${LOG_MESSAGES.EMAIL_SENT_SUCCESSFULLY} ${JSON.stringify(artist)}`
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      return error
    }
  }

  async organizerWelcomeEmail(
    organizer: { userId: string; email: string },
    data: {
      organizerName: string;
    }
  ) {
    try {

      this.loggingService.log(
        `${LOG_MESSAGES.WELCOME_ORGANIZER_EMAIL}` +
        JSON.stringify(organizer) +
        " " +
        JSON.stringify(data)
      );
      data.organizerName = data.organizerName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();

      const body = {
        eventName: this.ORGNAIZER_WELCOME_EVENT,
        emailContent: {
          organizerName: data.organizerName,
        },
        receiverIds: [organizer],
      };

      await this.notificationService.notification_call(body)
      this.loggingService.log(
        `${LOG_MESSAGES.EMAIL_SENT_SUCCESSFULLY} ${JSON.stringify(organizer)}`
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      return error
    }
  }

  async vendorOnboarded(
    organizer: { userId: string; email: string },
    data: {
      organizerName: string;
      vendorName: string;
    }
  ) {
    try {
      this.loggingService.log(
        LOG_MESSAGES.VENDOR_ONBOARD +
        JSON.stringify(organizer) +
        " " +
        JSON.stringify(data)
      );
      data.organizerName = data.organizerName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      data.vendorName = data.vendorName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      const body = {
        eventName: this.VENDOR_ONBOARDED_TO_EVENT,
        emailContent: data,
        receiverIds: [organizer],
      };

      await this.notificationService.notification_call(body)
      this.loggingService.log(
        `${LOG_MESSAGES.EMAIL_SENT_SUCCESSFULLY} ${JSON.stringify(organizer)}`
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      return error
    }
  }

  async advertiserOnboarded(
    organizer: { userId: string; email: string },
    data: {
      organizerName: string;
      advertiserName: string;
    }
  ) {
    try {

      this.loggingService.log(
        LOG_MESSAGES.ADVERTISER_ONBOARD +
        JSON.stringify(organizer) +
        " " +
        JSON.stringify(data)
      );
      data.organizerName = data.organizerName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      data.advertiserName = data.advertiserName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      const body = {
        eventName: this.ADVERTISER_ONBOARDED_TO_EVENT,
        emailContent: data,
        receiverIds: [organizer],
      };

      await this.notificationService.notification_call(body)
      this.loggingService.log(
        `${LOG_MESSAGES.EMAIL_SENT_SUCCESSFULLY} ${JSON.stringify(organizer)}`
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      return error
    }
  }

  async artistOnboarded(
    organizer: { userId: string; email: string },
    data: {
      organizerName: string;
      artistName: string;
    }
  ) {
    try {

      this.loggingService.log(
        `${LOG_MESSAGES.ARTIST_ONBOARD}` +
        JSON.stringify(organizer) +
        " " +
        JSON.stringify(data)
      );
      data.organizerName = data.organizerName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      data.artistName = data.artistName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      const body = {
        eventName: this.ARTIST_ONBOARDED_TO_EVENT,
        emailContent: data,
        receiverIds: [organizer],
      };

      await this.notificationService.notification_call(body)
      this.loggingService.log(
        `${LOG_MESSAGES.EMAIL_SENT_SUCCESSFULLY} ${JSON.stringify(organizer)}`
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      this.errorService.error({ message: ERROR_MESSAGES.EMAIL_ERR }, 500);
    }
  }

  async artistAddedToEvent(
    artist: { userId: string; email: string },
    data: {
      artistName: string;
      eventName: string;
      startDate: string;
      startTime: string;
      endTime: string;
    }
  ) {
    try {

      this.loggingService.log(
        LOG_MESSAGES.ARTIST_ADDED_TO_EVENT +
        JSON.stringify(artist) +
        " " +
        JSON.stringify(data)
      );
      data.artistName = data.artistName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      const body = {
        eventName: this.ARTIST_ADDED_TO_EVENT,
        emailContent: {
          artistName: data.artistName,
          eventName: data.eventName,
          startDate: data.startDate,
          startTime: data.startTime,
          endTime: data.endTime,
        },
        receiverIds: [artist],
      };

      await this.notificationService.notification_call(body)

      this.loggingService.log(
        `${LOG_MESSAGES.ARTIST_EMAIL_SUCCESS}  ${JSON.stringify(
          artist
        )}`
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      return error
    }
  }

  async advertiserAddedToEvent(
    advertiser: { userId: string; email: string },
    data: {
      advertiserName: string;
      eventName: string;
      startDate: string;
      startTime: string;
      endTime: string;
    }
  ) {
    try {

      this.loggingService.log(
        `${LOG_MESSAGES.ADVERTISER_ADDED_TO_EVENT}` +
        JSON.stringify(advertiser) +
        " " +
        JSON.stringify(data)
      );
      data.advertiserName = data.advertiserName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      const body = {
        eventName: this.ADVERTISER_ADDED_TO_EVENT,
        emailContent: {
          advertiserName: data.advertiserName,
          eventName: data.eventName,
          startDate: data.startDate,
          startTime: data.startTime,
          endTime: data.endTime,
        },
        receiverIds: [advertiser],
      };

      await this.notificationService.notification_call(body)

      this.loggingService.log(
        `${LOG_MESSAGES.ADVERTISER_EMAIL_SUCCESS} ${JSON.stringify(
          advertiser
        )}`
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      return error
    }
  }

  async advertiserEventCancelled(
    advertiser: { userId: string; email: string },
    data: {
      userName: string;
    }
  ) {
    try {

      data.userName = data.userName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      this.loggingService.log(
        `${LOG_MESSAGES.WELCOME_ADVERTSIER_MAIL}` +
        JSON.stringify(advertiser) +
        " " +
        JSON.stringify(data)
      );

      const body = {
        eventName: this.ADVERTISER_EVENT_CANCELLED,
        emailContent: {
          advertiserName: data.userName,
        },
        receiverIds: [advertiser],
      };

      await this.notificationService.notification_call(body)
      this.loggingService.log(
        `${LOG_MESSAGES.EMAIL_SENT_SUCCESSFULLY} ${JSON.stringify(advertiser)}`
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      this.errorService.error({ message: ERROR_MESSAGES.EMAIL_ERR }, 500);
    }
  }

  async artistEventCancelled(
    artist: { userId: string; email: string },
    data: {
      userName: string;
    }
  ) {
    try {

      this.loggingService.log(
        `${LOG_MESSAGES.WELCOME_ARTIST_EMAIL}` +
        JSON.stringify(artist) +
        " " +
        JSON.stringify(data)
      );
      data.userName = data.userName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      const body = {
        eventName: this.ARTIST_EVENT_CANCELLED,
        emailContent: {
          artistName: data.userName,
        },
        receiverIds: [artist],
      };

      await this.notificationService.notification_call(body)
      this.loggingService.log(
        `${LOG_MESSAGES.EMAIL_SENT_SUCCESSFULLY} ${JSON.stringify(artist)}`
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      return error
    }
  }

  async organizerEventCancelled(
    organizer: { userId: string; email: string },
    data: {
      organizerName: string;
    }
  ) {
    try {

      this.loggingService.log(
        `${LOG_MESSAGES.CANCEL_MAIL_ORGANIZER}` +
        JSON.stringify(organizer) +
        " " +
        JSON.stringify(data)
      );
      data.organizerName = data.organizerName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      const body = {
        eventName: this.ORGANIZER_CANCEL_EVENT,
        emailContent: {
          organizerName: data.organizerName,
        },
        receiverIds: [organizer],
      };

      await this.notificationService.notification_call(body)
      this.loggingService.log(
        `${LOG_MESSAGES.EMAIL_SENT_SUCCESSFULLY} ${JSON.stringify(organizer)}`
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      this.errorService.error({ message: ERROR_MESSAGES.EMAIL_ERR, error }, 500);
    }
  }

  async organizerUpcomingEvent(
    organizer: { userId: string; email: string },
    data: {
      organizerName: string;
      startDate: any;
      startTime: string;
      endTime: string;
    }
  ) {
    try {

      this.loggingService.log(
        `SENDING UPCOMING EVENT MAIL FOR ORGANIZER` +
        JSON.stringify(organizer) +
        " " +
        JSON.stringify(data)
      );
      data.organizerName = data.organizerName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      const body = {
        eventName: this.ORGANIZER_UPCOMING_EVENT,
        emailContent: {
          organizerName: data.organizerName,
          startDate: data.startDate,
          startTime: data.startTime,
          endTime: data.endTime,
        },
        receiverIds: [organizer],
      };

      await this.notificationService.notification_call(body)
      this.loggingService.log(
        `${LOG_MESSAGES.EMAIL_SENT_SUCCESSFULLY} ${JSON.stringify(organizer)}`
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      throw this.errorService.error({ message: ERROR_MESSAGES.EMAIL_ERR, error }, 400)
    }
  }

  async eventCreationSuccess(
    organizer: { userId: string; email: string },
    data: {
      organizerName: string;
      eventName: string;
      startDate: string;
      startTime: string;
      endTime: string;
      eventVenue: string;
      eventCategory: string;
      eventDescription: string;
    }
  ) {
    try {

      this.loggingService.log(
        LOG_MESSAGES.SENDING_EVENT_CREATION_SUCCESS +
        JSON.stringify(organizer) +
        " " +
        JSON.stringify(data)
      );
      data.organizerName = data.organizerName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      const body = {
        eventName: this.EVENT_CREATION_SUCCESS,
        emailContent: {
          organizerName: data.organizerName,
          eventName: data.eventName,
          startDate: data.startDate,
          startTime: data.startTime,
          endTime: data.endTime,
          eventVenue: data.eventVenue,
          eventCategory: data.eventCategory,
          eventDescription: data.eventDescription,
        },
        receiverIds: [organizer],
      };
      await this.notificationService.notification_call(body)
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      return error
    }
  }

  async eventTicketSaleStart(
    organizer: { userId: string; email: string },
    data: {
      organizerName: string;
      eventName: string;
      startDate: string;
      startTime: string;
      endTime: string;
    }
  ) {
    try {

      this.loggingService.log(
        `${LOG_MESSAGES.SENDING_EVENT_CREATION_SUCCESS}` +
        JSON.stringify(organizer) +
        " " +
        JSON.stringify(data)
      );
      data.organizerName = data.organizerName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      const body = {
        eventName: this.EVENT_TICKET_SALE_START,
        emailContent: {
          organizerName: data.organizerName,
          eventName: data.eventName,
          startDate: data.startDate,
          startTime: data.startTime,
          endTime: data.endTime,
        },
        receiverIds: [organizer],
      };

      await this.notificationService.notification_call(body)
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      return error
    }
  }
  async artistupcomingEvent(
    user: { userId: string; email: string },
    data: {
      userName: string;
      eventName: string;
      startDate: any;
      startTime: string;
      endTime: string;
    }
  ) {
    try {

      this.loggingService.log(
        `${LOG_MESSAGES.UPCOMING_EVENT_USERS}` +
        JSON.stringify(user) +
        " " +
        JSON.stringify(data)
      );
      data.userName = data.userName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
      const body = {
        eventName: this.ARTIST_UPCOMING_EVENT,
        emailContent: {
          userName: data.userName,
          eventName: data.eventName,
          startDate: data.startDate,
          startTime: data.startTime,
          endTime: data.endTime,
        },
        receiverIds: [user],
      };

      await this.notificationService.notification_call(body)

      this.loggingService.log(
        `${LOG_MESSAGES.ARTIST_EMAIL_SUCCESS}  ${JSON.stringify(
          user
        )}`
      );
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      return error
    }
  }

  async ticketCountRequest(
    organizer: { userId: string; email: string },
    data: {
      organizerName: string,
      ticketCount: string,
      eventName: string,
      eventDate: string,
      startTime: string,
      endTime: string
    }
  ) {
    try {

      this.loggingService.log(
        LOG_MESSAGES.EVENT_TICKET_REQUEST +
        JSON.stringify(organizer) +
        " " +
        JSON.stringify(data)
      );
      data.organizerName = data.organizerName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();

      const body = {
        eventName: this.EVENT_TICKET_REQUEST,
        emailContent: {
          organiserName: data.organizerName,
          ticketCount: data.ticketCount,
          eventName: data.eventName,
          eventDate: data.eventDate,
          startTime: data.startTime,
          endTime: data.endTime
        },
        receiverIds: [organizer],
      };
      await this.notificationService.notification_call(body);
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      return error
    }
  }


  async bulkEventInviteRequest(
    organizer: any,
  ) {
    try {
      this.loggingService.log(
        LOG_MESSAGES.CSV_INVITE_REQUEST +
        JSON.stringify(organizer)
      );

      const body = {
        eventName: this.CSV_INVITE_REQUEST,
        receiverIds: organizer,
      };

      let response = await this.notificationService.notification_call(body);

      return response;
    } catch (error) {
      this.loggingService.error(LOG_MESSAGES.ERROR_EMAIL, error);
      return error
    }
  }
}
