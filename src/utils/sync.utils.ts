import { redisClient } from "../app";
import { LoggerType } from "../interfaces/logger.interface";
import UserModelModel from "../models/user.model";
import LoggerHelper from "./logger.utils";

class SyncUtils {
  static initiate() {
    this.syncUser();
  }

  static syncUser() {
    UserModelModel.fetchSync()
      .then((users) => {
        users.forEach(async (user) => {
          await redisClient.SET(`users:${user._id}`, JSON.stringify(user));
        });

        new LoggerHelper({
          message: `Synced ${users.length} users`,
          type: LoggerType.info,
          tag: "Sync",
        }).log();
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching users ${error}`,
          type: LoggerType.error,
          tag: "Sync",
        }).log();
      });
  }
}

export default SyncUtils;
