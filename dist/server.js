"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const app_1 = require("./app");
const logger_utils_1 = __importDefault(require("./utils/logger.utils"));
const logger_interface_1 = require("./interfaces/logger.interface");
const sync_utils_1 = __importDefault(require("./utils/sync.utils"));
(0, dotenv_1.config)();
const port = process.env.PORT;
app_1.app.listen(port, () => {
    new logger_utils_1.default({
        type: logger_interface_1.LoggerType.info,
        message: `Server started on port ${port}`,
        tag: "Server",
    }).log();
    new logger_utils_1.default({
        type: logger_interface_1.LoggerType.info,
        message: `Connected with MongoDB Database Engine`,
        tag: "MongoDB",
    }).log();
});
app_1.redisClient
    .connect()
    .then((_) => __awaiter(void 0, void 0, void 0, function* () {
    new logger_utils_1.default({
        type: logger_interface_1.LoggerType.info,
        message: `Connected with Redis Database Engine`,
        tag: "Redis",
    }).log();
}))
    .catch((error) => {
    new logger_utils_1.default({
        type: logger_interface_1.LoggerType.error,
        message: error,
        tag: "Redis",
    }).log();
});
sync_utils_1.default.initiate();
//# sourceMappingURL=server.js.map