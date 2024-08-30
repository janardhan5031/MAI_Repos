import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
const AWS = require("aws-sdk");
import { v4 } from "uuid";
import { ErrorService } from "./common/services/errorService";
import { v4 as uuidV4 } from "uuid";
import {
  imageMimeTypes,
  videoMimeTypes,
  audioMimeTypes,
} from "./common/shared/file_types";
import { ConfigurationService } from "./common/config/config.service";
import {
  CONTENT_TYPE,
  CSV_FILE_VALIDATIONS,
  ERROR_MESSAGES,
  EVENT_STATUS,
  FILE_EXTENSIONS,
  LOG_MESSAGES,
  MEDIA_TYPE,
  PROGRESS_ORGANIZER,
  REGEX,
  SUCCESS_MESSAGE,
  UploadFileType,
  VALID_SEAT_RANGES,
} from "./common/config/constants";
import { Readable } from "stream";
import { LoggingService } from "./common/logging/logging.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
const ffmpeg = require("fluent-ffmpeg");
const { ObjectId } = require("mongodb");
import { parse, ParserOptionsArgs } from 'fast-csv';
@Injectable()
export class AppService {
  constructor(
    private readonly errorService: ErrorService,
    private readonly ConfigService: ConfigurationService,
    @InjectModel(Event.name)
    private eventModel: Model<Event>
  ) { }

  /**
 * Retrieves the dimensions (width and height) of an image buffer using ffmpeg and ffprobe.
 * @param {Buffer} buffer - The input buffer containing image data.
 * @returns {Promise<{ width: number, height: number }>} - A Promise that resolves with an object containing the width and height of the image.
 */
  async getResolution(buffer): Promise<any> {
    return new Promise((resolve, reject) => {
      /* Creating a buffer stream. */
      const inputStream = new Readable();
      /* Pushing the buffer into the stream */
      inputStream.push(buffer);
      /* End the stream data */
      inputStream.push(null); // Signal end of data

      /* Initializing ffmpeg to read the input stream. */
      ffmpeg(inputStream)
        .inputFormat('image2pipe')
        .ffprobe((err, data) => {
          if (err) {
            reject(new Error(`Failed to get image dimensions: ${err.message}`));
          } else {
            /* In the ffmpeg stream data it can get the width and height of the image. */
            const { width, height } = data.streams[0];
            /* Returning the width and height of the image. */
            resolve({ width, height });
          }
        });
    });
  }

  /**
 * Validates the resolution (width and height) of uploaded files based on their type.
 * @param {Array<{ buffer: Buffer }>} files - An array of file objects containing buffer data.
 * @param {string} type - The type of upload (e.g., 'thumbnail', 'coverphoto').
 */
  async validateFileResolution(files, type) {
    try {
      /* Check the type is thumbnail or coverphoto. */
      if ([UploadFileType.THUMBNAIL, UploadFileType.COVERPHOTO].includes(type)) {
        /* Retrieve width and height of the file using getResolution method */
        const { width, height } = await this.getResolution(files.buffer);
        /* intialize max-width and max-height variables as per resolution's */
        let minWidth, minHeight
        if (type === UploadFileType.THUMBNAIL) {
          // 400px * 400px
          minWidth = 400;
          minHeight = 400;
        } else if (type === UploadFileType.COVERPHOTO) {
          // 3200px * 410px
          minWidth = 1000;
          minHeight = 410;
        }
        LoggingService.log(`Validate File Resolution TYPE: ${type} MAX-HEIGHT: ${minHeight} MAX-WIDTH: ${minWidth} CURRENT-IMAGE-HEIGHT: ${height} CURRENT-IMAGE-WIDTH: ${width} condition: ${!(width >= minWidth && height >= minHeight)}`);
        /* If the width and height of the image is not matching to the max-width and max-height then return error.  */
        if (!(width >= minWidth && height >= minHeight)) {
          /* Returning the error. */
          this.errorService.error(
            { message: `${ERROR_MESSAGES.INVALID_RESOLUTION} ${minWidth}x${minHeight}` },
            400
          );
        }
      }
    } catch (error) {
      /* Return error. */
      this.errorService.error({ message: error }, 400);
    }
  }

  async uploadFile(input: any, loginResponse: any) {
    try {
      /* destructuring files and type from input. */
      let { files, type } = input;

      /* Validate the file resolution based on type. */
      await this.validateFileResolution(files, type);

      let fileUrl;
      if (
        !(
          loginResponse?.isOrganizer ||
          loginResponse?.isArtist ||
          loginResponse.isAdvertiser
        )
      )
        this.errorService.error(
          { message: ERROR_MESSAGES.NOT_AN_ORGANIZER },
          400
        );
      const fileSizeMb = Math.ceil(files.size) / (1024 * 1024);
      if (fileSizeMb > 20)
        this.errorService.error(
          { message: ERROR_MESSAGES.FILE_SIZE_TOO_LARGE },
          400
        );
      fileUrl = await this.uploadFilechanged(files);
      fileUrl.location = await this.extractPathFromURL(fileUrl.location);
      return fileUrl;
    } catch (error) {
      this.errorService.error({ message: error }, 400);
      return error;
    }
  }

  async IsAllowedMimeTypes(
    files: Express.Multer.File[],
    mimeTypes
  ): Promise<boolean> {
    /*extract mime types from uploaded files.*/
    const fileExtensions = files["files"].map((file) => file.mimetype);

    /*check all the mime types are matched or not.*/
    const results = await Promise.all(
      fileExtensions.map(async (fileMimeType) => {
        return mimeTypes.includes(fileMimeType);
      })
    );

    /*if one file mime type is not matched then return false.*/
    return results.every((res) => res);
  }

  /*extract images and videos from files.*/
  private async extractFiles(files: Express.Multer.File[]) {
    const images = files["files"].filter((file) =>
      imageMimeTypes.includes(file.mimetype)
    );
    const videos = files["files"].filter((file) =>
      videoMimeTypes.includes(file.mimetype)
    );
    return { images, videos };
  }

  /*check image and video size validations.*/
  async checkImageAndVideoFileSize(images, videos) {
    const maxImageSize = 25 * 1024 * 1024; // 10MB in bytes
    const maxVideoSize = 25 * 1024 * 1024; // 50MB in bytes

    let isImgSize = new Promise((resolve, reject) => {
      for (const image of images) {
        if (image.size > maxImageSize) {
          resolve({
            success: false,
            error: `${ERROR_MESSAGES.IMAGE_SIZE_EXCEEDS_LIMIT} ${image.originalname}`,
          });
        }
      }
      resolve({
        success: true,
        error: SUCCESS_MESSAGE.ALL_IMAGES_WITHIN_LIMITS,
      });
    });

    let isVideoSize = new Promise((resolve, reject) => {
      for (const video of videos) {
        if (video.size > maxVideoSize) {
          resolve({
            success: false,
            error: `${ERROR_MESSAGES.VIDEO_SIZE_EXCEEDS_LIMIT} ${video.originalname}`,
          });
        }
      }
      resolve({
        success: true,
        error: SUCCESS_MESSAGE.ALL_VIDEOS_WITHIN_LIMITS,
      });
    });

    return await Promise.all([isImgSize, isVideoSize]);
  }

  async uploadFiles(files: any, loginResponse: any) {
    try {
      /*accessing by artist if not throw error.*/
      if (
        !loginResponse ||
        !(
          loginResponse?.isArtist ||
          loginResponse.isOrganizer ||
          loginResponse.isAdvertiser
        )
      ) {
        this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_ACCESS_TOKEN },
          HttpStatus.UNAUTHORIZED
        );
      }

      /*if files check files length or else files false.*/
      if (files ? (files["files"] ? false : true) : false) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.SELECT_AT_LEAST_ONE_FILE,
          },
          400
        );
      }

      /*check uploaded files has image and video mime types or not.*/
      const isAllowed = await this.IsAllowedMimeTypes(files, [
        ...imageMimeTypes,
        ...videoMimeTypes,
      ]);
      if (!isAllowed)
        this.errorService.error(
          {
            message: ERROR_MESSAGES.ONLY_IMAGE_VIDEO_FILES,
          },
          400
        );

      /*extracting images and videos from uploaded files.*/
      const { images, videos } = await this.extractFiles(files);

      /*check image and video sizes are exceeded or not.*/
      const checkImgVideSize = [
        ...(await this.checkImageAndVideoFileSize(images, videos)),
      ].filter((res) => res["success"] === false);

      /*if file sizes exceeded then return file size exceeded.*/
      if (checkImgVideSize.length) {
        this.errorService.error(
          { message: ERROR_MESSAGES.FILE_SIZE_EXCEEDED },
          400
        );
      }

      /*accessing by artist/advertiser/organizer if not throw error.*/
      if (
        !loginResponse ||
        !(
          loginResponse?.isOrganizer ||
          loginResponse?.isArtist ||
          loginResponse.isAdvertiser
        )
      ) {
        this.errorService.error(
          { message: ERROR_MESSAGES.AUTHORIZATION_REQUIRED },
          400
        );
      }

      return {
        isOk: true,
        message: SUCCESS_MESSAGE.ASSETS_UPLOAD,
        assets: await this.uploadMultipleFiles([...images, ...videos], false),
      };
    } catch (error) {
      this.errorService.error({ message: error.message }, error.status);
      return error;
    }
  }

  async checkAudioSize(audioFiles) {
    const maxAudioSize = 30 * 1024 * 1024; // 30MB in bytes

    let isAudioSize = new Promise((resolve) => {
      for (const audio of audioFiles) {
        if (audio.size > maxAudioSize) {
          resolve({
            success: false,
            error: `${ERROR_MESSAGES.IMAGE_SIZE_EXCEEDS_LIMIT} ${audio.originalname}`,
          });
        }
      }
      resolve({
        success: true,
        error: SUCCESS_MESSAGE.ALL_IMAGES_WITHIN_LIMITS,
      });
    });

    return await Promise.all([isAudioSize]);
  }

  async uploadArtistTracks(files, loginResponse) {
    try {
      /*accessing by artist if not throw error.*/
      if (!loginResponse || !loginResponse?.isArtist) {
        this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_ACCESS_TOKEN },
          HttpStatus.UNAUTHORIZED
        );
      }

      /*if files check files length or else files false.*/
      if (files ? (files["files"] ? false : true) : false) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.SELECT_AT_LEAST_ONE_FILE,
          },
          400
        );
      }

      /*check uploaded files has image and video mime types or not.*/
      const isAllowed = await this.IsAllowedMimeTypes(files, audioMimeTypes);
      if (!isAllowed)
        this.errorService.error(
          {
            message: ERROR_MESSAGES.ONLY_AUDIO_FILES_ALLOWED,
          },
          400
        );

      /*check image and video sizes are exceeded or not.*/
      const checkAudioSize = [
        ...(await this.checkAudioSize(files["files"])),
      ].filter((res) => res["success"] === false);

      /*if file sizes exceeded then return file size exceeded.*/
      if (checkAudioSize.length) {
        this.errorService.error(
          { message: ERROR_MESSAGES.AUDIO_FILE_SIZE_EXCEEDED },
          400
        );
      }

      return {
        isOk: true,
        message: SUCCESS_MESSAGE.FILE_UPLOAD_SUCCESS,
        assets: await this.uploadMultipleFiles(files["files"], true),
      };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async uploadMultipleFiles(files, type) {
    const s3 = new AWS.S3({
      signatureVersion: "v4",
      accessKeyId: this.ConfigService.get("ACCESS_KEY"),
      secretAccessKey: this.ConfigService.get("SECRET_ACCESS_KEY"),
      region: this.ConfigService.get("REGION"),
    });
    const fileUrls: any = [];

    for (const file of files) {
      let fileName = file.originalname
        .trim()
        .replace(REGEX.REPLACE_SPECIAL_CHARACTERS, "_");
      const params = {
        Bucket: this.ConfigService.get("BUCKET_NAME"),
        Key: `key${uuidV4()}_${Date.now()}`, // Use a unique key for each file
        Body: file.buffer, // The file buffer
      };

      const uploadResult = await s3.upload(params).promise();
      fileUrls.push({
        _id: new ObjectId(),
        link: uploadResult.Location,
        fileName: file.originalname,
        type: type
          ? MEDIA_TYPE.AUDIO
          : imageMimeTypes.includes(file.mimetype)
            ? MEDIA_TYPE.IMAGE
            : MEDIA_TYPE.VIDEO,
      });
    }
    return fileUrls;
  }

  async uploadFilechanged(file) {
    const s3 = new AWS.S3({
      accessKeyId: this.ConfigService.get("ACCESS_KEY"),
      secretAccessKey: this.ConfigService.get("SECRET_ACCESS_KEY"),
      region: this.ConfigService.get("REGION"),
    });
    let temp = file.originalname.split(".");
    // retrieve the file extesion
    let fileExtension = temp[temp.length - 1];
    // rename the origninal file name if it has characters other than alpha-numaric with '_'
    let fileName = temp[0].replace(/[^a-zA-Z0-9]/g, "_");
    // add unique identity for each file name
    fileName = fileName + "_" + v4() + "." + fileExtension;
    const params = {
      Bucket: this.ConfigService.get("BUCKET_NAME"),
      Key: fileName,
      Body: file.buffer,
      ACL: "public-read",
      ContentType:
        fileExtension == FILE_EXTENSIONS.pdf
          ? `application/${fileExtension}`
          : fileExtension == FILE_EXTENSIONS.mp4
            ? CONTENT_TYPE.VIDEO_MP4
            : fileExtension == FILE_EXTENSIONS.mp3
              ? CONTENT_TYPE.AUDIO_MP3
              : fileExtension,
    };

    // storing in s3
    return new Promise((resolve, reject) => {
      s3.upload(params, function (s3Err: any, data: any) {
        if (s3Err) {
          reject(s3Err);
        } else {
          resolve({ location: data.Location, filename: fileName });
        }
      });
    });
  }

  async extractPathFromURL(url) {
    const baseUrls = [
      this.ConfigService.get("AWS_URL"),
      this.ConfigService.get("AWS_URLS"),
    ];
    const results = await Promise.all(
      baseUrls.map(async (baseUrl) => {
        if (url.startsWith(baseUrl)) {
          return url.split(baseUrl)[1];
        }
        return null;
      })
    );
    const filteredResults = results.filter((result) => result !== null);
    return filteredResults[0];
  }

  async updateTicketsAndUploadCsv(file, input, loginResponse): Promise<any> {
    try {
      if (!["text/csv", "application/csv"].includes(file?.mimetype))
        this.errorService.error(
          {
            message: ERROR_MESSAGES.ONLY_CSV_UPLOAD_ERROR,
          },
          400
        );

      /* Destructuring all the input and login response */
      let { eventId, ticketCount = 0 } = input;
      const { isOrganizer, userId } = loginResponse;
      /* Converting ticket count string to a number. */
      ticketCount = +ticketCount

      if (!loginResponse || !isOrganizer) {
        this.errorService.error(
          { message: ERROR_MESSAGES.INVALID_ACCESS_TOKEN },
          HttpStatus.UNAUTHORIZED
        );
      }

      /* Event id is empty or invalid then return error. */
      if (!eventId || !REGEX.OBJECTID_REGEX.test(eventId)) {
        throw new HttpException(ERROR_MESSAGES.INVALID_EVENT_ID, HttpStatus.BAD_REQUEST);
      }

      /* Ticket count is empty or invalid or 0 then return error. */
      if (!ticketCount || Number.isNaN(ticketCount) || ticketCount === 0) {
        throw new HttpException(ERROR_MESSAGES.TICKET_COUNT_EMPTY_ERROR, HttpStatus.BAD_REQUEST);
      }

      /* Get event data where isPrivate is true. */
      const eventData = await this.eventModel.aggregate([
        {
          $match: {
            _id: new ObjectId(eventId),
            status: { $in: [EVENT_STATUS.UNPUBLISHED, EVENT_STATUS.PUBLISHED] },
            isDeleted: false,
            isPrivate: true,
            organizer: new ObjectId(userId)
          }
        },
        {
          $lookup: {
            from: "venues",
            localField: "venue",
            foreignField: "_id",
            pipeline: [{
              $project: {
                _id: 1,
                "userCount.max": 1
              }
            }],
            as: "venue"
          }
        },
        {
          $lookup: {
            from: "eventcategories",
            localField: "category",
            foreignField: "_id",
            pipeline: [{ $project: { eventCategory: 1, _id: 1 } }],
            as: "category",
          }
        },
        {
          $project: {
            category: 1,
            venue: 1,
            status: 1
          }
        }
      ]);
      /* If event is not there then consider as he is not the organizer. */
      if (!eventData.length) {
        throw new HttpException(ERROR_MESSAGES.NOT_AN_ORGANIZER, HttpStatus.BAD_REQUEST);
      }

      /* Extracting category name from eventsData. */
      const categoryName = eventData[0]?.category[0]?.eventCategory;

      if (categoryName === "DEBATE" && eventData[0]?.status === EVENT_STATUS.PUBLISHED) {
        throw new HttpException(ERROR_MESSAGES.TICKET_DETAILS_NOT_UPDATED, HttpStatus.BAD_REQUEST);
      }

      /* Passing file and ticket count so that max rows and CSV validation would be done there. */
      const validationResult = await this.validateCSV(file.buffer, ticketCount, categoryName);

      /* If validationresult has any errors then return errors. */
      if (validationResult.errors?.length > 0) {
        // throwing the return because we doesnt need custom filter for these beacuse errors are inside a array.
        return {
          isOk: false,
          response: {
            statusCode: 400,
            message: ERROR_MESSAGES.CSV_VALIDATION_ERROR,
            errors: validationResult.errors
          }
        }
      }

      /* Ticket count is not matched with the csv rows then return error. */
      if (validationResult?.rowCount !== ticketCount) {
        return {
          isOk: false,
          response: {
            statusCode: 400,
            message: ERROR_MESSAGES.CSV_VALIDATION_ERROR,
            errors: [`CSV row count (${validationResult?.rowCount}) does not match ticket count (${ticketCount}).`]
          }
        }
      }

      /* Get venue user count. */
      const venueUserCount = eventData[0]?.venue[0]?.userCount?.max || 0;
      /* If userCount is more than venue count.*/
      if (validationResult?.rowCount > venueUserCount || ticketCount > venueUserCount) {
        return {
          isOk: false,
          response: {
            statusCode: 400,
            message: ERROR_MESSAGES.CSV_VALIDATION_ERROR,
            errors: [`venue having capacity of ${venueUserCount}.`]
          }
        }
      }

      /* Get Uploaded s3 link and csv object. */
      const csvObject = await this.getUploadedCsvObject(file, validationResult?.rowCount);

      /* Update event object with uploaded csv and  */
      await this.eventModel.updateOne(
        { _id: new ObjectId(eventId), isDeleted: false },
        {
          $set: {
            ticketPrice: 0,
            ticketCount: ticketCount,
            csv: csvObject
          },
          $addToSet: {
            progress: {
              $each: [PROGRESS_ORGANIZER.TICKETS]
            }
          }
        }
      );

      return {
        isOk: true,
        response: {
          statusCode: 200,
          message: SUCCESS_MESSAGE.TICKETS_UPDATED
        }
      }
    } catch (error) {
      this.errorService.error({ message: error ? error.message : LOG_MESSAGES.ERROR_UPDATING_TICKETS }, error.status);
    }
  }

  private getUploadedCsvObject(file, rowCount): Promise<Object> {
    const s3 = new AWS.S3({
      accessKeyId: this.ConfigService.get("ACCESS_KEY"),
      secretAccessKey: this.ConfigService.get("SECRET_ACCESS_KEY"),
      region: this.ConfigService.get("REGION"),
    });
    let temp = file.originalname.split(".");
    /* Retrieve the file extesion */
    let fileExtension = temp[temp.length - 1];
    /* Rename the origninal file name if it has characters other than alpha-numaric with '_' */
    let fileName = temp[0].replace(/[^a-zA-Z0-9]/g, "_");
    /* Add unique identity for each file name */
    fileName = fileName + "_" + v4() + "." + fileExtension;
    const params = {
      Bucket: this.ConfigService.get("BUCKET_NAME"),
      Key: fileName,
      Body: file.buffer,
      ACL: "public-read"
    };

    /* Storing in s3 */
    return new Promise((resolve, reject) => {
      s3.upload(params, function (s3Err: any, data: any) {
        if (s3Err) {
          reject(s3Err);
        } else {
          resolve({ csvLink: data.Location, csvFileName: file.originalname, csvRows: rowCount });
        }
      });
    });
  }

  async validateCSV(file, maxRows, categoryName): Promise<{ errors: string[], rowCount: number }> {
    const errors: string[] = [];
    const seatNumbers = new Set<string>();
    const emailIds = new Set<string>();
    const headerMap = new Map<string, string>();
    let rowCount = 0;

    return new Promise((resolve) => {
      let headersValid;

      const stream = parse({ headers: true } as ParserOptionsArgs)
        .on('data', async (row) => {
          if (!headersValid) {
            headersValid = this.validateHeaders(row, headerMap, errors, categoryName);
            if (!headersValid.allHeadersValid) {
              stream.destroy();
              return resolve({ errors: headersValid?.errors.length ? headersValid?.errors : [ERROR_MESSAGES.ERROR_CSV_HEADERS], rowCount });
            }
          }

          
          if(!row || Object.values(row).every((value: string) => value.trim() === '')) {
            /* If row if empty then not consider it is valid hence removing the row from the validations. */
            return;
          };
            
          rowCount++;      
          const rowErrors = await this.validateRow(row, seatNumbers, emailIds, rowCount, headerMap, categoryName);
          errors.push(...rowErrors);

          if (errors.length > CSV_FILE_VALIDATIONS.MAX_ERRORS) {
            stream.destroy();
            return resolve({ errors: [ERROR_MESSAGES.ERROR_REPLACE_CSV], rowCount });
          }
        })
        .on('end', () => {
          resolve({ errors, rowCount });
        })
        .on('error', (error) => {
          resolve({ errors: [`Error reading CSV file: ${error.message}`], rowCount });
        });

      stream.write(file);
      stream.end();
    });
  }

  private validateHeaders(row: any, headerMap: Map<string, string>, errors: string[], categoryName) {
    const headers = Object.keys(row);
    let allHeadersValid = true;

    /* If category is debate then validations is different if not need to validate emailids only. */
    const requiredHeaders = categoryName === 'Debate' ? CSV_FILE_VALIDATIONS?.debateRequiredHeaders : CSV_FILE_VALIDATIONS?.nonDebateRequiredHeaders;

    requiredHeaders.forEach((header) => {
      if (!headers.includes(header)) {
        errors.push(`Missing required header: ${header}`);
        allHeadersValid = false;
      } else {
        headerMap.set(header, header);
      }
    });

    // Check for any extra headers not expected
    headers.forEach((header) => {
      /* Checking headers not considered the empty values and headers only can includes required headers. */
      if (header !== '' && !requiredHeaders.includes(header)) {
        errors.push(`Unexpected header: ${header}`);
        allHeadersValid = false;
      }
    });
    return { allHeadersValid, errors };
  }

  // Function to validate seat number
  async isValidSeatNumber(seatNo: string) {
    const match = seatNo.match(/^([A-F])([0-9]+)$/);
    if (!match) return false;
    
    const prefix = match[1];
    const number = parseInt(match[2], 10);
    
    const range = VALID_SEAT_RANGES.find(r => r.prefix === prefix);
    if (!range) return false;
    return number >= range.start && number <= range.end;
  };

  private async validateRow(row: any, seatNumbers: Set<string>, emailIds: Set<string>, rowIndex: number, headerMap: Map<string, string>, categoryName: string): Promise<string[]> {
    const rowErrors: string[] = [];

    if (categoryName === 'Debate') {
      /* If you update the csv file validation headers you need to add those fields here. */
      const seatNoField = headerMap.get(CSV_FILE_VALIDATIONS.debateRequiredHeaders[0]);
      const emailIdField = headerMap.get(CSV_FILE_VALIDATIONS.debateRequiredHeaders[1]);
      const participantTypeField = headerMap.get(CSV_FILE_VALIDATIONS.debateRequiredHeaders[2]);

      let seatNo = row[seatNoField];
      seatNo = seatNo.toUpperCase();
      const emailId = row[emailIdField];
      const participantType = row[participantTypeField];

      /* Skip validation if all fields are empty */
      if (!seatNo && !emailId && !participantType) {
        return rowErrors;
      }

      if ((!seatNo && emailId) || (seatNo && !emailId)) {
        rowErrors.push(`Row ${rowIndex}: Both '${seatNoField}' and '${emailIdField}' must be provided together`);
        return rowErrors;
      }
      const isValidRow = await this.isValidSeatNumber(seatNo);

      if (!seatNo) {
        rowErrors.push(`Row ${rowIndex}: Field '${seatNoField}' is missing or empty`);
      } else if (!isValidRow) {
        rowErrors.push(`Row ${rowIndex}: Field '${seatNoField}': ${row[seatNoField]} is invalid. Seat number should be within the valid ranges.`);
      } else if (seatNumbers.has(seatNo)) {
        rowErrors.push(`Row ${rowIndex}: Field '${seatNoField}' must be unique. Duplicate found: ${seatNo}`);
      } else {
        seatNumbers.add(seatNo);
      }

      if (!emailId || !CSV_FILE_VALIDATIONS?.emailRegex.test(emailId)) {
        rowErrors.push(`Row ${rowIndex}: Field '${emailIdField}' is missing or not a valid email`);
      } else if (emailIds.has(emailId)) {
        rowErrors.push(`Row ${rowIndex}: Field '${emailIdField}' must be unique. Duplicate found: ${emailId}`);
      } else {
        emailIds.add(emailId);
      }

      if (!participantType) {
        rowErrors.push(`Row ${rowIndex}: Field '${participantTypeField}' is missing or empty`);
      } else if (!CSV_FILE_VALIDATIONS?.validParticipantTypes.includes(participantType.toLowerCase())) {
        rowErrors.push(`Row ${rowIndex}: Field '${participantTypeField}' must be either 'participant' or 'guest'. Found: ${participantType}`);
      }
    } else {
      /* Catgory other than debate than need to validate email ids only. */
      const emailIdField = headerMap.get(CSV_FILE_VALIDATIONS.debateRequiredHeaders[1]);
      const emailId = row[emailIdField];
      if (!emailId || !CSV_FILE_VALIDATIONS?.emailRegex.test(emailId)) {
        rowErrors.push(`Row ${rowIndex}: Field '${emailIdField}' is missing or not a valid email`);
      } else if (emailIds.has(emailId)) {
        rowErrors.push(`Row ${rowIndex}: Field '${emailIdField}' must be unique. Duplicate found: ${emailId}`);
      } else {
        emailIds.add(emailId);
      }
    }
    /* Return all the row validated errors. */
    return rowErrors;
  }

}
