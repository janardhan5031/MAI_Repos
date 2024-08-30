import {
  CACHE_MANAGER,
  Controller,
  Get,
  Inject,
  Post,
  Headers,
  UploadedFiles,
  UseInterceptors,
  Response,
  Request,
  HttpException,
  BadRequestException,
  UploadedFile,
  HttpStatus
} from "@nestjs/common";
import { AppService } from "./app.service";
import { ConfigurationService } from "./common/config/config.service";
import { Cache } from "cache-manager";
import { FileFieldsInterceptor, FileInterceptor } from "@nestjs/platform-express";
import { Context } from "@nestjs/graphql";
import { LoggingService } from "./common/logging/logging.service";
import { ErrorService } from "./common/services/errorService";
import { RedisHelperService } from "./common/redis-helpers/redis-helper.service";
import { uuid } from "uuidv4";
import { AuthEngine } from "./common/services/auth_engine";
import { ERROR_MESSAGES, FILE_EXTENSIONS, LOG_MESSAGES, UploadFileType } from "./common/config/constants";
import { InjectModel } from "@nestjs/mongoose";
import { Artist } from "./common/database/entities/artist.entity";
import { Model } from "mongoose";
import { KafkaService } from "./common/kafka/kafka.service";
import { Organizer } from "./common/database/entities/organizer.entity";
import { Advertiser } from "./common/database/entities/advertiser.entity";
import { SkipThrottle } from "@nestjs/throttler";
const FormData = require("form-data");
const fs = require("fs");
const axios = require("axios");
const { ObjectId } = require("mongodb");

@Controller()
export class AppController {
  private AUTH_ENGINE_API_URL: string;
  constructor(
    private readonly appService: AppService,
    private redisHelper: RedisHelperService,
    private readonly configService: ConfigurationService,
    private readonly logginService: LoggingService,
    private readonly errorService: ErrorService,
    private readonly authEngine: AuthEngine,
    private readonly kafkaService: KafkaService,
    @Inject(CACHE_MANAGER) private cacheModule: Cache,
    @InjectModel(Artist.name)
    private readonly ArtistModel: Model<Artist>,
    @InjectModel(Organizer.name)
    private readonly OrganizerModel: Model<Organizer>,
    @InjectModel(Advertiser.name)
    private readonly AdvertiserModel: Model<Advertiser>
  ) {
    this.AUTH_ENGINE_API_URL = this.configService.get("AUTH_ENGINE_BASE_URL");
  }

  @Get("/health-check")
  @SkipThrottle()
  async getHello(): Promise<any> {
    let cacheValue = await this.cacheModule.get("HELLO_WORLD");
    const MESSAGE = ERROR_MESSAGES.HELLO_FROM_THE_OTHER_SIDE;
    if (cacheValue) {
      return cacheValue;
    }
    await this.cacheModule.set(
      "HELLO_WORLD",
      { from: "redis-cache", value: MESSAGE },
      { ttl: this.configService.get("REDIS_CACHE_TTL") }
    );
    return { from: "redis-cache", value: MESSAGE };
  }

  @Post("/update-profile")
  @UseInterceptors(FileFieldsInterceptor([{ name: "file", maxCount: 1 }]))
  async updateProfile(
    @UploadedFiles()
    file: {
      file?: Express.Multer.File[];
    },
    @Headers() context: any
  ) {
    let loginResponse = await this.redisHelper.getLoginResponse(
      context.authorization
    );
    if (!file || !file.file) {
      throw new BadRequestException(ERROR_MESSAGES.FILE_NOT_UPLOADED);
    }
    let temp = file?.file[0].originalname.split(".");
    let fileExtension = temp[temp.length - 1];
    let fileName = file.file[0].originalname.replace(/[^a-zA-Z0-9]/g, "_");
    fileName = fileName + uuid() + "." + fileExtension;
    if (!fs.existsSync("myFolder")) {
      fs.mkdirSync("myFolder");
    }

    fs.writeFile(`myFolder/${fileName}`, file.file[0].buffer, (err) => {
      if (err) {
        LoggingService.error(LOG_MESSAGES.FAILED_TO_WRITE_INTO_FILE, err);
      } else {
        LoggingService.log(LOG_MESSAGES.DATA_APPENDED_SUCCESSFULLY);
      }
    });
    let data = new FormData();
    data.append("file", fs.createReadStream(`myFolder/${fileName}`));

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${this.AUTH_ENGINE_API_URL}/user/upload/profile-image`,
      headers: {
        Authorization: `Bearer ${loginResponse.access_token}`,
        ...data.getHeaders(),
      },
      data: data,
    };

    return new Promise((resolve, reject) => {
      axios
        .request(config)
        .then((response) => {
          resolve(response.data);
          fs.rmdirSync("myFolder", { recursive: true });
        })
        .catch((error) => {
          reject(error?.response?.data);
        });
    });
  }

  @Post("/upload_file")
  @UseInterceptors(FileFieldsInterceptor([{ name: "file", maxCount: 1 }]))
  async uploadFile(
    @UploadedFiles()
    file: {
      file?: Express.Multer.File[];
    },
    @Context() context: any,
    @Response() res: any
  ): Promise<any> {
    try {
      if (!file || !file.file) {
        throw new HttpException(ERROR_MESSAGES.PLEASE_SELECT_A_FILE, 400);
      }
      const fileName = file.file[0].originalname;
      const fileExtension = fileName.split(".").pop();
      if (
        !(
          fileExtension === FILE_EXTENSIONS.png ||
          fileExtension === FILE_EXTENSIONS.jpg ||
          fileExtension === FILE_EXTENSIONS.jpeg ||
          fileExtension === FILE_EXTENSIONS.gif ||
          fileExtension === FILE_EXTENSIONS.svg
        )
      ) {
        this.errorService.error(
          {
            message:
              ERROR_MESSAGES.ONLY_IMAGE_FILES_ALLOWED
          },
          400
        );
      }

      if (!context.req.body.type) {
        this.errorService.error(
          {
            message:
              ERROR_MESSAGES.FILE_TYPE_REQUIRED
          },
          400
        );
      } else {
        if (!Object.values(UploadFileType).includes(context.req.body.type as UploadFileType)) {
          this.errorService.error(
            {
              message:
                ERROR_MESSAGES.INVALID_FILE_TYPE
            },
            400
          );
        }
      }
      // const filesList = Object.values(file)[0];
      const data: any = await this.appService.uploadFile(
        { files: file.file[0], type: context.req.body.type },
        context.req.loginResponse
      );
      res.status(200).json(data);
    } catch (error) {
      this.logginService.error(LOG_MESSAGES.UPLOAD_FILE_ERROR, error);
      throw new HttpException(
        error
          ? error.message
          : LOG_MESSAGES.UNABLE_TO_UPLOAD_FILES, 400
      );
    }
  }

  @Post("/upload_files")
  @UseInterceptors(FileFieldsInterceptor([{ name: "files", maxCount: 15 }]))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Context() context: any,
    @Response() res: any
  ) {
    try {
      /*return response from upload files event.*/
      const response = await this.appService.uploadFiles(
        files,
        context.req.loginResponse
      );

      res.status(200).json(response);
    } catch (error) {
      this.logginService.error(LOG_MESSAGES.UPLOAD_FILE_ERROR, error);
      throw new HttpException(
        error
          ? error.message
          : LOG_MESSAGES.UNABLE_TO_UPLOAD_FILES,
        error.status
      );
    }
  }

  @Post("/uploadArtistTracks")
  @UseInterceptors(FileFieldsInterceptor([{ name: "files", maxCount: 15 }]))
  async uploadArtistTracks(
    @UploadedFiles() files: Express.Multer.File[],
    @Context() context: any,
    @Response() res: any
  ) {
    try {
      const response = await this.appService.uploadArtistTracks(
        files,
        context.req.loginResponse
      );
      res.status(200).json(response);
    } catch (error) {
      this.logginService.error(LOG_MESSAGES.UPLOAD_FILE_ERROR, error);
      throw new HttpException(
        error
          ? error.message
          : LOG_MESSAGES.UNABLE_TO_UPLOAD_FILES,
        error.status
      );
    }
  }

  @Post("/update-avatar")
  async updateAvatar(
    @Response() res: any,
    @Request() req: any,
    @Context() context: any
  ) {
    try {
      /*get url from body.*/
      const { url: fileUrl, userId, gender } = req.body;

      if (!fileUrl) {
        this.errorService.error(
          {
            message: ERROR_MESSAGES.AVATAR_URL_NOT_FOUND,
          },
          400
        );
      }

      /*send url and login response to authEngine file.*/
      const response = await this.authEngine.uploadAvatar(
        fileUrl,
        context.req.loginResponse
      );

      if (context.req.loginResponse.roles[0] == 'EVENT_ARTIST') {
        const updatedArtistetails: any = await this.ArtistModel.findOneAndUpdate(
          { userId: userId },
          {
            isCustomAvatar: false,
            customAvatarUrl: null,
            avatarGender: gender
          },
          { new: true }
        );

        await this.kafkaService.sendMessage(
          this.configService.getKafkaTopic("UPDATE_ARTIST"),
          updatedArtistetails
        );
      } else if (context.req.loginResponse.roles[0] == 'EVENT_ORGANIZER') {

        const updatedOrgDetails: any = await this.OrganizerModel.findOneAndUpdate(
          { userId: userId },
          {
            avatarGender: gender
          },
          { new: true }
        );

        await this.kafkaService.sendMessage(
          this.configService.getKafkaTopic("ONBOARD_ORGANIZER"),
          updatedOrgDetails
        );
      } else if (context.req.loginResponse.roles[0] == 'EVENT_ADVERTISER') {

        const updatedAdvDetails: any = await this.AdvertiserModel.findOneAndUpdate(
          { userId: userId },
          {
            avatarGender: gender
          },
          { new: true }
        );

        await this.kafkaService.sendMessage(
          this.configService.getKafkaTopic("ONBOARD_ADVERTISER"),
          updatedAdvDetails
        );
      }

      res.status(200).json(response);
    } catch (error) {
      this.errorService.error(
        {
          message: error.message,
        },
        error.status
      );
    }
  }


  @Post('/tickets/csvUpdate')
  @UseInterceptors(FileInterceptor('csv'))
  async uploadCSV(
    @UploadedFile() csv: Express.Multer.File,
    @Response() res: any,
    @Request() request: any,
    @Context() context: any,
  ) {
    try {
      /* If there is no csv file then return error. */
      if (!csv) {
        throw new HttpException(ERROR_MESSAGES.NO_CSV_FILE, 400);
      }
      /* Validate csv file size (should not exceed 10MB) */
      const fileSizeMb = Math.ceil(csv.size) / (1024 * 1024);
      if (fileSizeMb > 10) {
        this.errorService.error(
          { message: ERROR_MESSAGES.FILE_SIZE_TOO_LARGE_CSV },
          HttpStatus.BAD_REQUEST
        );
      }
      /* If event is invalid. */
      const response = await this.appService.updateTicketsAndUploadCsv(csv, request.body, context.req.loginResponse);
      res.status(response?.isOk ? 200 : 400).send(response?.response);
    } catch (error) {
      this.logginService.error(LOG_MESSAGES.ERROR_UPDATING_TICKETS, error);
      this.errorService.error(
        {
          message: error.message ? error.message : LOG_MESSAGES.ERROR_UPDATING_TICKETS,
        },
        error.status
      );
    }
  }
}
