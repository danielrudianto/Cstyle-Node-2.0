import { connectionFactory } from "./utils/connector.utils";
import { Job, Worker } from "bullmq";
import LoggerHelper from "./utils/logger.utils";
import { LoggerType } from "./interfaces/logger.interface";
import WorkerController from "./controllers/worker.controller";

const workerOptions = {
  connection: {
    host: "localhost",
    port: 6379,
  },
};

const workerHandler = async (job: Job<any>) => {
  const name = job.name;
  switch (name) {
    case "createProduct":
      WorkerController.createProduct(job.data);
      break;
    case "updateProduct":
      WorkerController.updateProduct(job.data);
      break;
    case "updateProductImage":
      WorkerController.updateProductImages(job.data);
      break;
    case "createUser":
      WorkerController.createUser(job.data);
      break;
    case "updateUser":
      WorkerController.updateUser(job.data);
      break;
    case "deleteUser":
      WorkerController.deleteUser(job.data);
      break;
    case "createBill":
      WorkerController.createBill(job.data);
      break;
    case "insertStockIn":
      WorkerController.insertStockIn(job.data);
      break;
    case "insertStockOut":
      WorkerController.insertStockOut(job.data);
      break;
    case "checkOverflow":
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
