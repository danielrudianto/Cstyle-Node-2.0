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
const bullmq_1 = require("bullmq");
const logger_utils_1 = __importDefault(require("./utils/logger.utils"));
const logger_interface_1 = require("./interfaces/logger.interface");
const worker_controller_1 = __importDefault(require("./controllers/worker.controller"));
const workerOptions = {
    connection: {
        host: "localhost",
        port: 6379,
        concurrency: 1,
    },
};
const workerHandler = (job) => __awaiter(void 0, void 0, void 0, function* () {
    const name = job.name;
    switch (name) {
        case "createProduct":
            worker_controller_1.default.createProduct(job.data);
            break;
        case "updateProduct":
            worker_controller_1.default.updateProduct(job.data);
            break;
        case "updateProductImage":
            worker_controller_1.default.updateProductImages(job.data);
            break;
        case "deleteProduct":
            worker_controller_1.default.deleteProduct(job.data);
            break;
        case "createUser":
            worker_controller_1.default.createUser(job.data);
            break;
        case "updateUser":
            worker_controller_1.default.updateUser(job.data);
            break;
        case "deleteUser":
            worker_controller_1.default.deleteUser(job.data);
            break;
        case "createBill":
            yield worker_controller_1.default.createBill(job.data);
            break;
        case "deleteAdjustment":
            yield worker_controller_1.default.deleteAdjustment(job.data);
            break;
        case "insertStockIn":
            yield worker_controller_1.default.insertStockIn(job.data);
            break;
        case "insertStockOut":
            yield worker_controller_1.default.insertStockOut(job.data);
            break;
        case "insertStockOutTemp":
            yield worker_controller_1.default.insertStockOutCardOnly(job.data);
            break;
        case "removeStockOutTemp":
            yield worker_controller_1.default.removeStockOutCardOnly(job.data);
            break;
        case "insertStockOutOnly":
            yield worker_controller_1.default.insertStockOutOnly(job.data);
            break;
        case "insertStockOutTransfer":
            yield worker_controller_1.default.stockOutTransfer(job.data);
            break;
        case "insertStockInTransfer":
            yield worker_controller_1.default.stockInTransfer(job.data);
            break;
        case "removeStockIn":
            yield worker_controller_1.default.removeStockIn(job.data);
            break;
        case "removeStockOut":
            yield worker_controller_1.default.removeStockOut(job.data);
        case "checkOverflow":
            yield worker_controller_1.default.checkOverflow();
            break;
    }
});
const worker = new bullmq_1.Worker("queue", workerHandler, workerOptions);
worker.on("failed", (job, err) => {
    new logger_utils_1.default({
        type: logger_interface_1.LoggerType.error,
        message: `Job ${job === null || job === void 0 ? void 0 : job.id} [${job === null || job === void 0 ? void 0 : job.name}] has failed with ${err.message}`,
        tag: "Master worker",
    }).log();
});
worker.on("completed", (job, result) => {
    new logger_utils_1.default({
        type: logger_interface_1.LoggerType.info,
        message: `Job ${job.id} [${job.name}] completed at ${new Date().toString()}`,
        tag: "Master worker",
    }).log();
});
worker.on("error", (err) => {
    new logger_utils_1.default({
        type: logger_interface_1.LoggerType.error,
        message: `Error on completing job: ${err}`,
        tag: "Master worker",
    }).log();
});
//# sourceMappingURL=worker.js.map