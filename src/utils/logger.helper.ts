import Logger from "@ptkdev/logger";
import { LoggerInterface, LoggerType } from "../interfaces/logger.interface";

class LoggerHelper {
  type: LoggerType;
  message: string;
  tag: string;

  constructor(data: LoggerInterface) {
    this.type = data.type;
    this.message = data.message;
    this.tag = data.tag;
  }

  options = {
    colors: true,
    debug: true,
    info: true,
    warning: true,
    error: true,
    sponsor: true,
    write: true,
    path: {
      debug_log: "./logs/debug.log",
      error_log: "./logs/error.log",
    },
  };

  logger = new Logger(this.options);

  log(): void {
    switch (this.type) {
      case LoggerType.debug:
        this.logger.debug(this.message, this.tag);
        break;
      case LoggerType.info:
        this.logger.info(this.message, this.tag);
        break;
      case LoggerType.warning:
        this.logger.warning(this.message, this.tag);
        break;
      case LoggerType.error:
        this.logger.error(this.message, this.tag);
        break;
      case LoggerType.sponsor:
        this.logger.debug(this.message, this.tag);
        break;
    }
  }
}

export default LoggerHelper;
