"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("@ptkdev/logger"));
const logger_interface_1 = require("../interfaces/logger.interface");
class LoggerHelper {
    constructor(data) {
        this.options = {
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
        this.logger = new logger_1.default(this.options);
        this.type = data.type;
        this.message = data.message;
        this.tag = data.tag;
    }
    log() {
        switch (this.type) {
            case logger_interface_1.LoggerType.debug:
                this.logger.debug(this.message, this.tag);
                break;
            case logger_interface_1.LoggerType.info:
                this.logger.info(this.message, this.tag);
                break;
            case logger_interface_1.LoggerType.warning:
                this.logger.warning(this.message, this.tag);
                break;
            case logger_interface_1.LoggerType.error:
                this.logger.error(this.message, this.tag);
                break;
            case logger_interface_1.LoggerType.sponsor:
                this.logger.debug(this.message, this.tag);
                break;
        }
    }
}
exports.default = LoggerHelper;
//# sourceMappingURL=logger.utils.js.map