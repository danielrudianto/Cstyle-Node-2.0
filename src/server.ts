import { config } from "dotenv";
import { app, redisClient } from "./app";

import LoggerHelper from "./utils/logger.helper";
import { LoggerType } from "./interfaces/logger.interface";
import SyncUtils from "./utils/sync.helper";

config();
const port = process.env.PORT!;

app.listen(port, () => {
  new LoggerHelper({
    type: LoggerType.info,
    message: `Server started on port ${port}`,
    tag: "Server",
  }).log();

  new LoggerHelper({
    type: LoggerType.info,
    message: `Connected with MongoDB Database Engine`,
    tag: "MongoDB",
  }).log();
});

redisClient
  .connect()
  .then(async (_) => {
    new LoggerHelper({
      type: LoggerType.info,
      message: `Connected with Redis Database Engine`,
      tag: "Redis",
    }).log();
  })
  .catch((error) => {
    new LoggerHelper({
      type: LoggerType.error,
      message: error,
      tag: "Redis",
    }).log();
  });

SyncUtils.initiate();
