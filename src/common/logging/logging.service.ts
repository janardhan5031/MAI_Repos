/* eslint-disable prefer-const */
import { Logger, Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigurationService } from '../config/config.service';
import * as moment from 'moment';
import { FORMAT_DATE } from '../config/constants';
@Injectable()
export class LoggingService extends Logger {
  private timeStampFormat = FORMAT_DATE.DATE_MOMENT_FORMAT;
  private moment = require('moment');
  private LOG_PATH: string;
  private silent: boolean;
  private LOG_LEVEL: string;
  private opt: any;
  private logger: any;
  private fs = require('fs');

  constructor(config: ConfigurationService) {
    super();
    this.LOG_LEVEL = config.get('LOG_LEVEL');
    this.silent = config.get('ENABLE_LOGGING') ? false : true;
    this.LOG_PATH = config
      .get('LOG_PATH')
      .replace('%DATE%', moment().format(FORMAT_DATE.DATE_FORMAT).toString());
    const errorStackTracerFormat = winston.format((info) => {
      if (info.meta && info.meta instanceof Error) {
        info.message = `${info.message} ${info.meta.stack}`;
      }
      return info;
    });
    this.opt = {
      name: 'DailyRotateFile',
      filename: this.LOG_PATH,
      datePattern: FORMAT_DATE.DATE_FORMAT,
      zippedArchive: true,
      level: this.LOG_LEVEL,
      maxSize: '20m',
      maxFiles: '7d',
      silent: this.silent,
    };
    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.splat(), // Necessary to produce the 'meta' attribute
        errorStackTracerFormat(),
        winston.format.simple(),
      ),
      transports: [
        new winston.transports.Console({ format: winston.format.timestamp() }),
        new DailyRotateFile(this.opt),
      ],
    });

    if (this.silent) {
      this.logger.remove(DailyRotateFile);
    }
  }

  log(message: string) {
    let logMessage = {
      message: message,
      trace: '',
      level: 'debug',
      timestamp: this.moment().format(this.timeStampFormat),
      service: 'admin-service',
    };
    this.fs.appendFile(
      this.LOG_PATH.replace('%DATE%', moment().format('YYYY-MM-DD').toString()),
      JSON.stringify(logMessage) + '\n',
      (err) => {
        if (err) throw err;
      },
    );
    super.log(message);
  }

  error(message: string, trace: any) {
    let logMessage = {
      message: message,
      trace: JSON.stringify(trace),
      level: 'error',
      timestamp: this.moment().format(this.timeStampFormat),
      service: 'auth-service',
    };
    this.fs.appendFile(
      this.LOG_PATH,
      JSON.stringify(logMessage) + '\n',
      (err) => {
        if (err) throw err;
      },
    );
    super.error(message, JSON.stringify(trace));
  }
  warn(message: string) {
    let logMessage = {
      message: message,
      trace: '',
      level: 'warn',
      timestamp: this.moment().format(this.timeStampFormat),
      service: 'admin-service',
    };
    this.fs.appendFile(
      this.LOG_PATH,
      JSON.stringify(logMessage) + '\n',
      (err) => {
        if (err) throw err;
      },
    );
    super.warn(message);
  }
}
