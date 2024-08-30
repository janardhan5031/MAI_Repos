import "dotenv/config";
import winston from "winston";
import path from "path";
import DailyRotateFile from "winston-daily-rotate-file";

const logDir = path.join(__dirname, "../logs");
const logFileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp, data }) => {
    return JSON.stringify({ level, message, timestamp, data });
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message, data }) => {
    if (data) {
      return `LOG (${level}: ${message} ${JSON.stringify(data)})`;
    } else {
      return `LOG (${level}: ${message})`;
    }
  })
);

const errorStackTracerFormat = winston.format((info) => {
  if (info.meta && info.meta instanceof Error) {
    info.message = `${info.message} ${info.meta.stack}`;
  }
  return info;
});

const transportOptions = {
  filename: path.join(logDir, "debug-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  level: "debug",
  maxSize: "20m",
  maxFiles: "7d",
  silent: false,
};

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.splat(),
    errorStackTracerFormat(),
    logFileFormat
  ),
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new DailyRotateFile(transportOptions),
  ],
});

class LoggerInstance {
  public warn(message: string, data?: any): void {
    logger.warn(message, { data });
  }

  public info(message: string, data?: any): void {
    logger.info(message, { data });
  }

  public error(message: string, data?: any): void {
    logger.error(message, { data });
  }

  public debug(message: string, data?: any): void {
    logger.debug(message, { data });
  }

  public verbose(message: string, data?: any): void {
    logger.verbose(message, { data });
  }
}

const loggerInstance = new LoggerInstance();
export default loggerInstance;
