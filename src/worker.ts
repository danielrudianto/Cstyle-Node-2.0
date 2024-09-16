import { connectionFactory } from "./utils/connector.utils";
import { Job as BullJob, Worker } from "bullmq";
import LoggerHelper from "./utils/logger.utils";
import { LoggerType } from "./interfaces/logger.interface";
import WorkerController from "./controllers/worker.controller";
import {
  CommonUpdateWorkerInterface,
  CommonWorkerInterface,
  UpdateProductImageDataInterface,
} from "./interfaces/worker.interface";
import { StockInInterface } from "./interfaces/stock-in.interface";
import {
  RemoveStockInInterface,
  RemoveStockOutInterface,
  StockOutInterface,
  StockOutTempInterface,
  StockOutTransferInterface,
} from "./interfaces/stock-out.interface";

const workerOptions = {
  connection: {
    host: "localhost",
    port: 6379,
    concurrency: 1,
  },
};

interface JobDataMap {
  createProduct: CommonWorkerInterface;
  updateProduct: CommonWorkerInterface;
  updateProductImage: UpdateProductImageDataInterface;
  deleteProduct: CommonWorkerInterface;

  createUser: CommonWorkerInterface;
  updateUser: CommonWorkerInterface;
  deleteUser: CommonWorkerInterface;
  createBill: CommonWorkerInterface;
  insertStockIn: StockInInterface;
  insertStockOut: StockOutInterface;
  checkOverflow: void;
  insertStockOutTemp: StockOutTempInterface;
  insertStockOutOnly: StockOutInterface;
  insertStockOutTransfer: StockOutTransferInterface;
  insertStockInTransfer: StockOutTransferInterface;
  removeStockOutTemp: StockOutTempInterface;
  removeStockIn: RemoveStockInInterface;
  removeStockOut: RemoveStockOutInterface;
  deleteAdjustment: CommonWorkerInterface;
  updateProductType: CommonUpdateWorkerInterface;
  updateProductBrand: CommonUpdateWorkerInterface;
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
    case "deleteProduct":
      WorkerController.deleteProduct(job.data as CommonWorkerInterface);
      break;
    case "updateProductType":
      WorkerController.updateProductType(
        job.data as CommonUpdateWorkerInterface
      );
      break;
    case "updateProductBrand":
      WorkerController.updateProductBrand(
        job.data as CommonUpdateWorkerInterface
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
      await WorkerController.createBill(job.data as CommonWorkerInterface);
      break;
    case "deleteAdjustment":
      await WorkerController.deleteAdjustment(
        job.data as CommonWorkerInterface
      );
      break;
    case "insertStockIn":
      await WorkerController.insertStockIn(job.data as StockInInterface);
      break;
    case "insertStockOut":
      await WorkerController.insertStockOut(job.data as StockOutInterface);
      break;
    case "insertStockOutTemp":
      await WorkerController.insertStockOutCardOnly(
        job.data as StockOutTempInterface
      );
      break;
    case "removeStockOutTemp":
      await WorkerController.removeStockOutCardOnly(
        job.data as StockOutTempInterface
      );
      break;
    case "insertStockOutOnly":
      await WorkerController.insertStockOutOnly(job.data as StockOutInterface);
      break;
    case "insertStockOutTransfer":
      await WorkerController.stockOutTransfer(
        job.data as StockOutTransferInterface
      );
      break;
    case "insertStockInTransfer":
      await WorkerController.stockInTransfer(
        job.data as StockOutTransferInterface
      );
      break;
    case "removeStockIn":
      await WorkerController.removeStockIn(job.data as RemoveStockInInterface);
      break;
    case "removeStockOut":
      await WorkerController.removeStockOut(
        job.data as RemoveStockOutInterface
      );
    case "checkOverflow":
      await WorkerController.checkOverflow();
      break;
  }
};

const worker = new Worker("queue", workerHandler, workerOptions);

worker.on("failed", (job, err) => {
  new LoggerHelper({
    type: LoggerType.error,
    message: `Job ${job?.id} [${job?.name}] has failed with ${err.message}`,
    tag: "Master worker",
  }).log();
});

worker.on("completed", (job, result) => {
  new LoggerHelper({
    type: LoggerType.info,
    message: `Job ${job.id} [${
      job.name
    }] completed at ${new Date().toString()}`,
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
