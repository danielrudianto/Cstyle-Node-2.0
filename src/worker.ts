import { connectionFactory } from "./utils/connector.utils";
import { Job as BullJob, Worker } from "bullmq";
import LoggerHelper from "./utils/logger.utils";
import { LoggerType } from "./interfaces/logger.interface";
import WorkerController from "./controllers/worker.controller";
import {
  CommonWorkerInterface,
  UpdateProductImageDataInterface,
} from "./interfaces/worker.interface";
import { StockInInterface } from "./interfaces/stock-in.interface";
import { StockOutInterface, StockOutTempInterface } from "./interfaces/stock-out.interface";

const workerOptions = {
  connection: {
    host: "localhost",
    port: 6379,
  },
};

interface JobDataMap {
  createProduct: CommonWorkerInterface;
  updateProduct: CommonWorkerInterface;
  updateProductImage: UpdateProductImageDataInterface;
  createUser: CommonWorkerInterface;
  updateUser: CommonWorkerInterface;
  deleteUser: CommonWorkerInterface;
  createBill: CommonWorkerInterface;
  insertStockIn: StockInInterface;
  insertStockOut: StockOutInterface;
  checkOverflow: void;
  insertStockOutTemp: StockOutTempInterface;
}

type JobName = keyof JobDataMap;

interface Job<T extends JobName> {
  name: T;
  data: JobDataMap[T];
}

const workerHandler = async <T extends JobName>(job: Job<T>) => {
  const name = job.name;
  switch (name) {
    case "createProduct":
      WorkerController.createProduct(job.data as CommonWorkerInterface);
      break;
    case "updateProduct":
      WorkerController.updateProduct(job.data as CommonWorkerInterface);
      break;
    case "updateProductImage":
      WorkerController.updateProductImages(
        job.data as UpdateProductImageDataInterface
      );
      break;
    case "createUser":
      WorkerController.createUser(job.data as CommonWorkerInterface);
      break;
    case "updateUser":
      WorkerController.updateUser(job.data as CommonWorkerInterface);
      break;
    case "deleteUser":
      WorkerController.deleteUser(job.data as CommonWorkerInterface);
      break;
    case "createBill":
      WorkerController.createBill(job.data as CommonWorkerInterface);
      break;
    case "insertStockIn":
      WorkerController.insertStockIn(job.data as StockInInterface);
      break;
    case "insertStockOut":
      WorkerController.insertStockOut(job.data as StockOutInterface);
      break;
    case "checkOverflow":
      break;
    case "insertStockOutTemp":
      // Used for stock card and stock only
      WorkerController.insertStockOutCardOnly(job.data as StockOutTempInterface);
      break;
  }
};

const worker = new Worker("queue", workerHandler, workerOptions);

worker.on("failed", (job, err) => {
  new LoggerHelper({
    type: LoggerType.error,
    message: `Job ${job?.id} has failed with ${err.message}`,
    tag: "Master worker",
  }).log();
});

worker.on("completed", (job, result) => {
  new LoggerHelper({
    type: LoggerType.info,
    message: `Job ${job.id} completed with result ${result}`,
    tag: "Master worker",
  }).log();
});

worker.on("error", (err) => {
  new LoggerHelper({
    type: LoggerType.error,
    message: `Error on completing job: ${err}`,
    tag: "Master worker",
  }).log();
});
