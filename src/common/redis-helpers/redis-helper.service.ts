/* eslint-disable prefer-const,@typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires */
import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import { ConfigurationService } from "src/common/config/config.service";
import { Cache } from "cache-manager";
import { LoggingService } from "src/common/logging/logging.service";
import { EventDateInput } from "src/modules/event/dto/event.input_type";
const { ObjectId } = require("mongodb");

interface Event {
  eventId: string;
  duration: number;
  organizer: string;
  startTime: string;
  endTime: string;
}
import { REDIS_KEYS } from "../config/constants";
import { promisify } from "util";
import { mergeEventTimes } from "../helper/helper";
@Injectable()
export class RedisHelperService {
  TTL: number;
  LOGIN_TTL: number;
  LOCK_TIMEOUT: number;
  constructor(

    private readonly loggingService: LoggingService,
    private readonly config: ConfigurationService,
    @Inject(CACHE_MANAGER) private cacheModule: Cache
  ) {
    this.TTL = this.config.get("VENUE_TTL");
    this.LOGIN_TTL = this.config.get("LOGIN_TTL");
    this.LOCK_TIMEOUT = 300;
  }

  async getLoginResponse(access_token: string) {
    let loginResponse: any = await this.cacheModule.get(
      `loginDeatils-${access_token}`
    );
    return loginResponse;
  }
  async acquireLock(key: any): Promise<boolean> {
    const lockKey = JSON.stringify(`lock:${this.config.get("KAFKA_ENV")}-${key}`);
    const store: any = this.cacheModule.store;
    const client = store.getClient();
    const setAsync = promisify(client.set).bind(client);
    const result = await setAsync(lockKey, 'locked', 'EX', 120, 'NX');
   return result === 'OK';
  }
  async unlock(key: any): Promise<void> {
    const lockKey = JSON.stringify(`lock:${this.config.get("KAFKA_ENV")}-${key}`);
    const store: any = this.cacheModule.store;
    const client = store.getClient();
    const delAsync = promisify(client.del).bind(client);
    await delAsync(lockKey);
  }
  async saveLoginResponse(res: any) {
    const data = await this.cacheModule.set(
      `loginDeatils-Bearer ${res.access_token}`,
      res,
      {
        ttl: this.LOGIN_TTL,
      }
    );

    return data;
  }

  async clearLoginResponse(res: any) {
    await this.cacheModule.del(`loginDeatils-${res}`);
  }

  async saveImagesLink(fileUrls: any, email: string) {
    await this.cacheModule.set(`uploads-${email}`, fileUrls, {
      ttl: this.LOGIN_TTL,
    });
  }

  async getImagesLink(email: any) {
    let links: any = await this.cacheModule.get(`uploads-${email}`);
    return links;
  }

  async blockVenue(venueId: String, eventDates: any) {
    let venue = JSON.stringify(venueId);
    let event = JSON.stringify(eventDates.eventId);
    let key = REDIS_KEYS.BLOCK_VENUE + ":" + venue + "-" + event;
    let data = await this.cacheModule.set(key, eventDates, {
      ttl: this.TTL,
    });
    return data;
  }
  async getBlockedVenues(venueId: any) {
    let venueEvents = [];
    this.loggingService.log(`getting blocked venue for venue : ${venueId}`)
    let venue = JSON.stringify(venueId);
    let key = REDIS_KEYS.BLOCK_VENUE + ":" + venue;
    const pattern = key + "*";
    let keys: any = await this.getKeysWithPartialMatch(pattern);
    await Promise.all(
      keys?.map(async (key, index) => {
        let data = await this.cacheModule.get(key);
        venueEvents.push(data);
      })
    )
    return venueEvents;
  }

  async clearBookedVenue(eventDates: any, venueId) {
    let venue = JSON.stringify(venueId);
    let event = JSON.stringify(eventDates.eventId);
    let key = REDIS_KEYS.BLOCK_VENUE + ":" + venue + "-" + event;
    await this.cacheModule.del(key);
    return false;
  }

  async getpreSignedURL(url: any) {
    const key = JSON.stringify(REDIS_KEYS.CACHED_URL + url);
    let presignedURL: string = await this.cacheModule.get(key);
    return presignedURL;
  }

  async setPreSignedURL(url: any, data: string) {
    const key = JSON.stringify(REDIS_KEYS.CACHED_URL + url);
    let presignedURL: string = await this.cacheModule.set(key, data, {
      ttl: 1 * 60,
    });
    return presignedURL;
  }

  async getKeysWithPartialMatch(pattern, cursor = '0') {
    const store: any = this.cacheModule.store;
    if (typeof store.getClient === 'function') {
      const client = store.getClient();
      const scanAsync = promisify(client.scan).bind(client);
      const keys: string[] = [];
      let cursor = '0';

      do {
        const reply = await scanAsync(cursor, 'MATCH', pattern);
        cursor = reply[0];
        keys.push(...reply[1]);
      } while (cursor !== '0');

      return keys;
    } else {
      throw new Error('The store does not support getClient method.');
    }
  }

  async venuePaymentInfoforanEvent(eventId: String, eventDetails: any) {
    let key = JSON.stringify(eventId);
    key = REDIS_KEYS.PAYMENT + key;
    let existingDates: any = await this.cacheModule.get(key);
    let data = eventDetails;
    data.endDate = new Date(eventDetails.endDate);
    data.startDate = new Date(eventDetails.startDate);
    await this.cacheModule.set(key, data, {
      ttl: this.TTL, // Set the TTL as needed
    });
    return data;
  }
  async getVenuePayment(eventId: String) {
    let key = JSON.stringify(eventId);
    key = REDIS_KEYS.PAYMENT + key;
    let existingDates = await this.cacheModule.get(key);
    return existingDates;
  }
  async clearVenuePayment(eventId: String) {
    let key = JSON.stringify(eventId);
    key = REDIS_KEYS.PAYMENT + key;
    let existingDates = await this.cacheModule.get(key);
    if (existingDates) {
      await this.cacheModule.del(key);
      return true;
    }
    return false;
  }

  /* To get all the venue based on the key. */
  async checkVenueIsBlocked(redisKeys: string[]) {
    for (let key of redisKeys) {

      const redis = await this.cacheModule.get(key);
      if (redis) {
        return { success: true, event: redis }
      }
    }
  }

  async checkVenueIsBlockedCount(redisKeys: string[], userTimeZone) {
    let count = 0
    let blockedTimes = []
    for (let key of redisKeys) {
      const redis = await this.cacheModule.get(key);
      if (redis) {
        count++;
        const keyParts = key.split('-');
        const date = Number(keyParts[3]);
        const year = Number(keyParts[1].substring(0, 4));
        const month = Number(keyParts[2].substring(0, 2));
        const day = Number(keyParts[3].substring(0, 2));
        const startTime = Number(keyParts[4].substring(0, 2));
        const endTime = Number(keyParts[5].substring(0, 2));
        let startDate = new Date(Date.UTC(year, month, (startTime === 23 ? day - 1 : day), startTime, 30))
        let endDate = new Date(Date.UTC(year, month, day, endTime, 30));
        // if (userTimeZone === "asia/kolkata") {

        blockedTimes.push({ startDate, endDate, duration: 1, venue: new ObjectId((keyParts[0])) });
      }
    }
    let mergedBlockedTimes = [];
    mergedBlockedTimes = await mergeEventTimes(blockedTimes)
    return { count, blockedTimes: mergedBlockedTimes };
  }


  /* To block the venue */
  async blockVenueEvent(redisKeys, redisValue) {
    for (let key of redisKeys) {
      await this.cacheModule.set(key, redisValue, { ttl: this.TTL });
    }
  }
}
