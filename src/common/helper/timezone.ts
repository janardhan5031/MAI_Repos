import { differenceInCalendarDays } from "date-fns";
import { Injectable } from "@nestjs/common";
import { LoggingService } from "../logging/logging.service";
import { ErrorService } from "../services/errorService";
import { ERROR_MESSAGES, FORMAT_DATE } from "../config/constants";
const moment = require("moment");
require("moment-timezone");
@Injectable()
export class TimeConversionHelperService {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly errorService: ErrorService
  ) {}
  async timeConversation(eventDates: any, timeZone: string) {
    const startDateObject = moment(eventDates.startDate);
    const formattedStartDate = startDateObject.format(FORMAT_DATE.DATE_YYMMDD);
    const combinedStartDateTimeString = `${formattedStartDate} ${eventDates.startTime}`;
    const localStartDateTime = moment.tz(
      combinedStartDateTimeString,
      FORMAT_DATE.DATE_FROMAT,
      timeZone
    );
    let startDate = new Date(localStartDateTime.utc());
    const endDateObject = moment(eventDates.endDate);
    const formattedendDate = endDateObject.format(FORMAT_DATE.DATE_YYMMDD);
    const combinedendDateTimeString = `${formattedendDate} ${eventDates.endTime}`;
    const localendDateTime = moment.tz(
      combinedendDateTimeString,
      FORMAT_DATE.DATE_FROMAT,
      timeZone
    );
    let endDate = new Date(localendDateTime.utc());
    const endDatewithStratTime = moment(eventDates.endDate);
    const formattedendDatewithStratTime = endDatewithStratTime.format(
      FORMAT_DATE.DATE_YYMMDD
    );
    const combinedendDatewithStratTimeString = `${formattedendDatewithStratTime} ${eventDates.startTime}`;
    const localendDatewithStratTime = moment.tz(
      combinedendDatewithStratTimeString,
      FORMAT_DATE.DATE_FROMAT,
      timeZone
    );
    let endDatewithstartTime = new Date(localendDatewithStratTime.utc());

    return {
      startDate,
      endDate,
      endDatewithstartTime,
    };
  }
  async validationEvent(
    startDate: Date,
    endDate: Date,
    eventDuration: number,
    timeZone: string
  ) {
    let sDate = new Date(startDate);
    let startDateUserTimeZone = moment.tz(
      sDate,
      FORMAT_DATE.DATE_FROMAT,
      timeZone
    );
    let endDateUserTimeZone = moment.tz(
      new Date(endDate),
      FORMAT_DATE.DATE_FROMAT,
      timeZone
    );
    let now = moment.tz(new Date(), FORMAT_DATE.DATE_FROMAT, timeZone);
    const isStartDateInPastandToday =
      startDateUserTimeZone.isBefore(now, "day") ||
      startDateUserTimeZone.isSame(now, "day");
    const isEndDateInPastandToday =
      endDateUserTimeZone.isBefore(now, "day") ||
      endDateUserTimeZone.isSame(now, "day");
    if (isStartDateInPastandToday || isEndDateInPastandToday) {
      this.errorService.error(
        {
          message: ERROR_MESSAGES.CREATE_EVENT_PAST_DAYS_ERROR,
        },
        400
      );
    }
    let [starthours, startminutes] = [
      sDate.getUTCHours(),
      sDate.getUTCMinutes(),
    ];
    try {
      let [endhours, endminutes] = [
        endDate.getUTCHours(),
        endDate.getUTCMinutes(),
      ];
      if (sDate && endDate && sDate > endDate) {
        this.errorService.error(
          { message: ERROR_MESSAGES.MISMATCH_DATE_ERROR },
          400
        );
      }
      const duration = endhours - starthours;
      const min_duration = endminutes - startminutes;
      if (min_duration) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.INVALID_DURATION_FORMAT_ERROR,
          },
          400
        );
      }
      let tenMonthsFromNow = moment().add(10, "months");
      tenMonthsFromNow = new Date(tenMonthsFromNow.tz(timeZone).utc().format());
      if (sDate > tenMonthsFromNow) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.EVENTS_SCHEDULED_ERROR,
          },
          400
        );
      }
      sDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(0, 0, 0, 0);
      const differenceInDays = Math.abs(
        differenceInCalendarDays(sDate, endDate)
      );
      if (differenceInDays > 30) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.CREATE_EVENT_ERROR,
          },
          400
        );
      }
      return true;
    } catch (error) {
      this.loggingService.error(
        ERROR_MESSAGES.INITIATE_VENUE_PAYMENT_ERROR,
        error
      );
      this.errorService.error({ message: error.message }, 400);
    }
  }
  async convertTZtoUTC(timeZone: string) {
    let newDate = moment();
    newDate = newDate.tz(timeZone).utc().format(FORMAT_DATE.DATE_MOMENT_FORMAT);
    return newDate;
  }
  async convertUTCtoTZDate(utcDate: Date, timeZone: string) {
    moment.tz.setDefault("UTC");
    const utcMoment = moment.utc(utcDate, FORMAT_DATE.DATE_TIME_FORMAT);
    let converteDate = utcMoment
      .clone()
      .tz(timeZone)
      .format(FORMAT_DATE.DATE_FORMAT);
    converteDate = new Date(converteDate);
    return converteDate; //.format('YYYY-MM-DDThh:mm:ss Z');
  }
  async convertUTCtoTZTime(utcDate: Date, timeZone: string) {
    moment.tz.setDefault("UTC");
    const utcMoment = moment.utc(utcDate, FORMAT_DATE.DATE_TIME_FORMAT);
    let converteDate = utcMoment
      .clone()
      .tz(timeZone)
      .format(FORMAT_DATE.HOUR_MINUTE);
    return converteDate; //.format('YYYY-MM-DDThh:mm:ss Z');
  }
  async convertUTCtoTZ(utcDate: Date, timeZone: string) {
    moment.tz.setDefault("UTC");
    const utcMoment = moment.utc(utcDate, FORMAT_DATE.DATE_TIME_FORMAT);
    let converteDate = utcMoment
      .clone()
      .tz(timeZone)
      .format(FORMAT_DATE.TIME_DATE_FORMAT);
    converteDate = new Date(converteDate);
    return converteDate; //.format('YYYY-MM-DDThh:mm:ss Z');
  }
  async convertToUserTimeZone(event, userTimeZone) {
    const userStartDateTime = moment(
      `${event.startDate} ${event.startTime} UTC`
    )
      .tz(userTimeZone)
      .format();
    const userEndDateTime = moment(`${event.endDate} ${event.endTime} UTC`)
      .tz(userTimeZone)
      .format();
    return {
      userStartDateTime,
      userEndDateTime,
    };
  }

  /* Converting user time to IST time zone. */
  async convertUserTimeZoneToIST(dateObject, timeZone) {
    const {startDate, startTime, endDate,endTime} = dateObject;
    const userStartDateTime = `${startDate}T${startTime}`;
    const userEndDateTime = `${endDate}T${endTime}`;

    // Convert to IST
    const istStartDateTime = moment.tz(userStartDateTime, timeZone).tz('Asia/Kolkata');
    const istEndDateTime = moment.tz(userEndDateTime, timeZone).tz('Asia/Kolkata');

  return {
    istStartDate: istStartDateTime.format('YYYY-MM-DD'),
    istStartTime: istStartDateTime.format('HH:mm:ss'),
    istEndDate: istEndDateTime.format('YYYY-MM-DD'),
    istEndTime: istEndDateTime.format('HH:mm:ss')
  };
  }
  async getTimeDifferenceWithUTC(userTimezone) {
  // Get the current time in UTC
  const nowInUTC = moment.utc();

  // Get the current time in the user's timezone
  const nowInUserTZ = moment.tz(nowInUTC, userTimezone);

  // Calculate the time difference in hours
  const timeDifference = nowInUserTZ.utcOffset() / 60;
  return timeDifference;
}
}
