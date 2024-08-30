import { HttpException } from "@nestjs/common";
const { ObjectId } = require("mongodb");
import {
  ERROR_MESSAGES,
  EVENT_STATUS,
  EventStatus,
  Initialstatus,
  PAYMENT_STATUS,
  REGEX,
  ROLES,
  SUCCESS_MESSAGE,
} from "../config/constants";
import { EventSchema } from "../database/entities/events.entity";
const moment = require("moment");
require("moment-timezone");
export function trimProperties(obj) {
  for (const prop in obj) {
    if (typeof obj[prop] === "string") {
      obj[prop] = obj[prop]?.trim();
    }
  }
  return obj;
}

// Helper function to handle roles
export async function handleRole(result, model, kyc) {
  const role = await model.aggregate([{ $match: { userId: result.data._id } }]);
  let userId;
  if (role.length) {
    userId = role[0]._id;
    let avatarGender = role[0]?.avatarGender;

    await model.findOneAndUpdate(
      { userId: result.data._id },
      { isKYCVerified: kyc }
    );
    return {
      userId,
      avatarGender,
      customAvatarUrl: role[0]?.customAvatarUrl,
      preferredName: role[0]?.preferredName,
    };
  } else {
    // If role is not found, throw an error
    throw new HttpException(ERROR_MESSAGES.INVALID_LOGIN, 400);
  }
}

export function isValidTimeZone(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (e) {
    return false;
  }
}
export function eventCheck(event) {
  try {
    if (!event) {
      throw new HttpException(ERROR_MESSAGES.INVALID_EVENT_ID, 400);
    }
    else if (event.status === EVENT_STATUS.UNPUBLISHED || event.status === EVENT_STATUS.PUBLISHED) {
      throw new HttpException(ERROR_MESSAGES.VENUE_PAYMENT, 400);
    } else if (event.status === EVENT_STATUS.NEW) {
      throw new HttpException(ERROR_MESSAGES.ALREADY_EVENT_PAYMENT_DONE, 400);
    } else if (event.status != EVENT_STATUS.DRAFT) {
      throw new HttpException(ERROR_MESSAGES.EVENT_NAME, 400);
    } else if (event?.eventStatus)
      throw new HttpException(
        ERROR_MESSAGES.ADDING_DETAILS_AFTER_SALE_START,
        400
      );
  } catch (e) {
    throw new HttpException(e, 400);
  }
}

export function convertTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
}

export function areTimesInRange(a, b, c, d) {
  const minutesA = convertTimeToMinutes(a);
  const minutesB = convertTimeToMinutes(b);
  const minutesC = convertTimeToMinutes(c);
  const minutesD = convertTimeToMinutes(d);
  if (minutesC < minutesD) {
    // c to d does not cross midnight
    return (
      minutesA >= minutesC &&
      minutesA <= minutesD &&
      minutesB >= minutesC &&
      minutesB <= minutesD
    );
  } else {
    // c to d crosses midnight
    return (
      (minutesA >= minutesC || minutesA <= minutesD) &&
      (minutesB >= minutesC || minutesB <= minutesD)
    );
  }
}
export function eventCheckbeforePayment(event, KYCCheck, venueId) {

  try {
    if (!event) {
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INVALID_EVENT_ID,
        },
        400
      );
    }
    //if event basic details are updated or not
    if (event?.status === Initialstatus.NEW)
      throw new HttpException(
        {
          message: ERROR_MESSAGES.EVENT_NAME,
        },
        400
      );
    if (event?.status === Initialstatus.UNPUBLISHED)
      throw new HttpException(
        {
          message: ERROR_MESSAGES.VENUE_PAYMENT,
        },
        400
      );
    // if payment is already done, then just returnt event data
    if (event.status != Initialstatus.DRAFT) {
      throw new HttpException(
        {
          message: SUCCESS_MESSAGE.PAYMENT_ALREADY_DONE,
        },
        400
      );
    }
    if (KYCCheck && !event.organizer[0].isKYCVerified) {
      throw new HttpException(
        {
          message: ERROR_MESSAGES.KYC_PENDING,
        },
        400
      );
    }
    if (venueId && !event?.category?.venues?.some(id => id.equals(new ObjectId(venueId)))) {
      throw new HttpException(
        {
          message: ERROR_MESSAGES.VENUE_ID_MISMATCH,
        },
        400
      );
    }
  } catch (error) {
    throw new HttpException(error, 400);
  }
}

export function checkEventStatusBeforeAddingDetails(event) {
  try {
    if (!event) {
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INVALID_EVENT_ID,
        },
        400
      );
    } else if (
      event.status === EVENT_STATUS.PUBLISHED &&
      event.eventStatus
    ) {
      throw new HttpException(
        {
          message: ERROR_MESSAGES.ADDING_DETAILS_AFTER_SALE_START,
        },
        400
      );
    }
  } catch (error) {
    throw new HttpException(error, 400);
  }
}
export function checkEventBeforeUpdatingDetails(event, eventCatgeoryCheck) {
  try {
    if (!event) {
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INVALID_EVENT_ID,
        },
        400
      );
    }
    else if ([Initialstatus.DRAFT, Initialstatus.NEW].includes(event.status)) {
      throw new HttpException(
        {
          message: `${ERROR_MESSAGES.CANNOT_GET_ADVERTISERS_BEFORE_PAYMENT}`,
        },
        409
      );
    } else if (eventCatgeoryCheck && event?.category === "Debate") {
      throw new HttpException(
        {
          message: ERROR_MESSAGES.INVALID_EVENT_ID,
        },
        400
      );
    }
    else if (
      event.status === "PUBLISHED" &&
      event?.eventStatus
    ) {
      throw new HttpException(
        {
          message: ERROR_MESSAGES.ADDING_DETAILS_AFTER_SALE_START,
        },
        400
      );
    }
  } catch (error) {
    throw new HttpException(error, 400);
  }
}

export function venuePaymentIdGeneration() {
  try {
    let referenceNumber =
      "MAIEVENTS" +
      "_" +
      Math.floor(Math.random() * (1000034000000120000 - 1 + 1)) +
      1;
    return referenceNumber;
  } catch (error) {
    throw new HttpException(error, 400);
  }
}

export function isValidUUID(uuid) {
  return REGEX.UUID_REGEX.test(uuid);
}

export function eventNameToCamelCase(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, ' ');
}

export function paymentCheck(paymentDetails, transaction) {
  try {
    if (!paymentDetails) {
      throw new HttpException(
        { message: ERROR_MESSAGES.PAYMENT_REFERENCE_NOT_MATCHED },
        400
      );
    }
    if (transaction.status != PAYMENT_STATUS.SUCCESS) {
      throw new HttpException({ message: ERROR_MESSAGES.PAYMENT_FAILED }, 400);
    }
    if (paymentDetails?.price != transaction.amount) {
      throw new HttpException(
        { message: ERROR_MESSAGES.PRICE_NOT_MATCHED },
        400
      );
    }
    if (paymentDetails?.referenceNumber != transaction.order?.refrenceNumber) {
      throw new HttpException(
        { message: ERROR_MESSAGES.PAYMENT_REFERENCE_NOT_MATCHED },
        400
      );
    }
  } catch (error) {
    throw new HttpException(error, 400);
  }
}
export function getEvents(status) {
  try {
    let expr;
    const commonExpr = {
      $cond: {
        if: { $ne: ["$type", ROLES.EVENT_VENDOR] },
        then: { $eq: ["$isDeleted", false] },
        else: true,
      },
    };
    let matchStatus;
    switch (status) {
      case "DRAFT":
        matchStatus = {
          status: { $in: [EVENT_STATUS.DRAFT] },
          eventStatus: { $in: [null] },
          isDeleted: false,
        };
        expr = commonExpr;
        break;
      case "UNPUBLISHED":
        matchStatus = {
          status: { $in: [EVENT_STATUS.UNPUBLISHED] },
          eventStatus: { $in: [null] },
          isDeleted: false,
        };
        expr = commonExpr;
        break;
      case "PUBLISHED":
        matchStatus = {
          status: { $in: [EVENT_STATUS.PUBLISHED] },
        };
        expr = {
          $cond: {
            if: { $eq: ["$type", ROLES.EVENT_ORGANIZER] },
            then: true,
            else: { $eq: ["$isDeleted", false] },
          },
        };
        break;
      case "LIVE":
        matchStatus = {
          status: { $in: [EVENT_STATUS.PUBLISHED] },
          eventStatus: { $in: [EVENT_STATUS.LIVE] },
          isDeleted: false,
          endTimeDate: { $gt: new Date() }
        };
        expr = commonExpr;
        break;
      case "UPCOMING":
        matchStatus = {
          status: { $in: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.UNPUBLISHED] },
          eventStatus: {
            $in: [null, EVENT_STATUS.SALESTARTED, EVENT_STATUS.SALESCHEDULED, EVENT_STATUS.ONGOING],
          },
          isDeleted: false,
        };
        expr = commonExpr;
        break;
      case "COMPLETED":
        matchStatus = {
          status: { $in: [EVENT_STATUS.PUBLISHED] },
          isDeleted: false,
          $or: [
            { eventStatus: EVENT_STATUS.COMPLETED },
            {
              eventStatus: EVENT_STATUS.LIVE,
              endTimeDate: { $lte: new Date() }
            }
          ]
        };
        expr = commonExpr;
        break;
      case "CANCELLED":
        matchStatus = {
          status: { $in: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.UNPUBLISHED] },
          $or: [
            { eventStatus: EVENT_STATUS.CANCELLED },
            { isDeleted: true },
          ]
        };
        break;
    }
    return {
      expr,
      matchStatus,
    };
  } catch (error) {
    throw new HttpException(error, 400);
  }
}

/* It can get all the date ranges between start and end dates. */
export const getDatesInRange = (startDate, endDate) => {
  // /* If it is a single event then return the startDate. */
  // if(startDate === endDate) {
  //   return [startDate]
  // }
  /* Get the start date. */
  let start = moment(startDate);
  /* Get the end date. */
  const end = moment(endDate);

  /* Intiate dates variable so that each and every date will be pushed into the array. */
  const dates = [];

  /* Loop to add each date to the array */
  while (start.isSameOrBefore(end)) {
    dates.push(start.format('YYYY-MM-DD'));
    start = start.add(1, 'days');
  }
  /* Returning all the dates in between the range. */
  return dates;
}

export function getTimesInRange(startTime, endTime) {
  const start = startTime.split(":").map(Number);
  const end = endTime.split(":").map(Number);

  let currentHour = start[0];
  let currentMinute = start[1];
  const endHour = end[0];
  const endMinute = end[1];

  const times = [];

  while (true) {
    const nextHour = (currentHour + 1) % 24;
    const nextMinute = currentMinute;

    const startFormatted = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    const endFormatted = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`;
    times.push({ start: startFormatted, end: endFormatted });

    if (nextHour === endHour && nextMinute === endMinute) {
      break;
    }

    currentHour = nextHour;
    currentMinute = nextMinute;
  }

  return times;
}

/* Generate block venue keys to store in redis. */
export const generateBlockVenueRedisKeys = (venueId: any, datesRange, timesRange) => {
  let dateIndex = 0;
  let keys = []
  return datesRange.flatMap((date, index) => {
    let currentDate = new Date(date)
    let day = currentDate.getUTCDate()
    let month = currentDate.getUTCMonth() + 1
    let year = currentDate.getUTCFullYear()
    let formatDate = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`
    timesRange.map((time, timeIndex) => {
      let startTime = parseInt(time.start.split(':')[0]);
      let endTime = parseInt(time.end.split(':')[0]);
      if (endTime <= startTime) {
        dateIndex++;
        currentDate = new Date(currentDate.setUTCDate(currentDate.getUTCDate() + 1))
        let day = currentDate.getUTCDate()
        let month = currentDate.getUTCMonth() + 1
        let year = currentDate.getUTCFullYear()
        formatDate = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`
        startTime = (startTime + 24) % 24; // Adjust start time if it's in the next day
      }
      // Generate the key
      const key = `${venueId}-${formatDate}-${String(startTime < 10 ? `0${startTime}` : startTime)}-${endTime < 10 ? `0${endTime}` : endTime}`;
      keys.push(key);
    })
    return keys
  }
  );
}


export function mergeEventTimes(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return [];
  }
  const mergedEvents = [];
  events.sort((a, b) => (a.startDate) - b.startDate);
  let currentEvent = { ...events[0] };
  for (let i = 1; i < events.length; i++) {
    const event = events[i];
    if (new Date(event.startDate) <= new Date(currentEvent.endDate)) {
      currentEvent.endDate = new Date(Math.max(new Date(currentEvent.endDate).getTime(), new Date(event.endDate).getTime()));
      currentEvent.duration = Number(((new Date(currentEvent.endDate).getTime() - new Date(currentEvent.startDate).getTime()) / (1000 * 60 * 60)).toFixed(2));
    } else {
      mergedEvents.push(currentEvent);
      currentEvent = { ...event };
    }
  }
  mergedEvents.push(currentEvent);

  return mergedEvents;
}

export function getWorkingTimeSlots(presentDate, userTimeZone) {
  // Convert presentDate to the user's timezone
  let workingStartTime = new Date(presentDate)
  const nowInUTC = moment.utc();
  // Get the current time in the user's timezone
  const nowInUserTZ = moment.tz(nowInUTC, userTimeZone);
  // Calculate the time difference in hours
  const timeDifference = nowInUserTZ.utcOffset() / 60;
  // Set working start time to yesterday at 18:30 in user's timezone
  new Date(workingStartTime.setUTCDate(presentDate.getUTCDate()))
  new Date(workingStartTime.setUTCHours(24 - Math.floor(timeDifference), 0 - (timeDifference % 1) * 60, 0, 0));
  const workingEndTime = new Date(
    presentDate.setUTCHours(23 - Math.floor(timeDifference), 0 - (timeDifference % 1) * 60, 0, 0)
  );
  return [{ startTime: workingStartTime, endTime: new Date(workingEndTime.setUTCDate(presentDate.getUTCDate() + 1)), duration: 23 }];
}

export function isValidUrl(url: string): boolean {
  try {
    const urlPattern = /^(https?|ftp):\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$|^https?:\/\/www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?$/;
    return urlPattern.test(url);
  }
  catch (e) {
    return false
  }

}
export function generateSequence(timeRange) {
  const intervals = {
    "00:00": 1, "00:15": 2, "00:30": 3, "00:45": 4,
    "01:00": 5, "01:15": 6, "01:30": 7, "01:45": 8,
    "02:00": 9, "02:15": 10, "02:30": 11, "02:45": 12,
    "03:00": 13, "03:15": 14, "03:30": 15, "03:45": 16,
    "04:00": 17, "04:15": 18, "04:30": 19, "04:45": 20,
    "05:00": 21, "05:15": 22, "05:30": 23, "05:45": 24,
    "06:00": 25, "06:15": 26, "06:30": 27, "06:45": 28,
    "07:00": 29, "07:15": 30, "07:30": 31, "07:45": 32,
    "08:00": 33, "08:15": 34, "08:30": 35, "08:45": 36,
    "09:00": 37, "09:15": 38, "09:30": 39, "09:45": 40,
    "10:00": 41, "10:15": 42, "10:30": 43, "10:45": 44,
    "11:00": 45, "11:15": 46, "11:30": 47, "11:45": 48,
    "12:00": 49, "12:15": 50, "12:30": 51, "12:45": 52,
    "13:00": 53, "13:15": 54, "13:30": 55, "13:45": 56,
    "14:00": 57, "14:15": 58, "14:30": 59, "14:45": 60,
    "15:00": 61, "15:15": 62, "15:30": 63, "15:45": 64,
    "16:00": 65, "16:15": 66, "16:30": 67, "16:45": 68,
    "17:00": 69, "17:15": 70, "17:30": 71, "17:45": 72,
    "18:00": 73, "18:15": 74, "18:30": 75, "18:45": 76,
    "19:00": 77, "19:15": 78, "19:30": 79, "19:45": 80,
    "20:00": 81, "20:15": 82, "20:30": 83, "20:45": 84,
    "21:00": 85, "21:15": 86, "21:30": 87, "21:45": 88,
    "22:00": 89, "22:15": 90, "22:30": 91, "22:45": 92,
    "23:00": 93, "23:15": 94, "23:30": 95, "23:45": 96
  };

  const [startTime, endTime] = timeRange.split('-');
  const startIdx = intervals[startTime];
  const endIdx = intervals[endTime];
  const sequence = [];
  if (startIdx <= endIdx) {
    for (let i = startIdx; i < endIdx; i++) {
      sequence.push(i);
    }
  } else {
    for (let i = startIdx; i <= 96; i++) {
      sequence.push(i);
    }
    for (let i = 1; i < endIdx; i++) {
      sequence.push(i);
    }
  }

  return sequence;
}

