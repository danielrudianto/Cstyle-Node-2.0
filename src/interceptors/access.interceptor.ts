import { NextFunction, Request, Response } from "express";
import { redisClient } from "../app";
import { ErrorList } from "../data/error-list";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";

class AccessInterceptor {
  static salesRequired = (req: Request, res: Response, next: NextFunction) => {
    const userID = req.body.userID;
    redisClient
      .get(`user:${userID}`)
      .then((user) => {
        if (user == null) {
          throw Error(ErrorList["USER_NOT_FOUND"]);
        } else {
          const parsedUser = JSON.parse(user);
          if (parsedUser.accessLevel < 2) {
            throw Error(ErrorList["ACCESS_DENIED"]);
          } else {
            next();
          }
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching user ${error}`,
          tag: "Access Interceptor",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static supervisorRequired = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userID = req.body.userID;
    redisClient
      .get(`user:${userID}`)
      .then((user) => {
        if (user == null) {
          throw Error(ErrorList["USER_NOT_FOUND"]);
        } else {
          const parsedUser = JSON.parse(user);
          if (parsedUser.accessLevel < 3) {
            throw Error(ErrorList["ACCESS_DENIED"]);
          } else {
            next();
          }
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching user ${error}`,
          tag: "Access Interceptor",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static administratorRequired = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userID = req.body.userID;
    redisClient
      .get(`user:${userID}`)
      .then((user) => {
        if (user == null) {
          throw Error(ErrorList["USER_NOT_FOUND"]);
        } else {
          const parsedUser = JSON.parse(user);
          if (parsedUser.accessLevel < 4) {
            throw Error(ErrorList["ACCESS_DENIED"]);
          } else {
            next();
          }
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching user ${error}`,
          tag: "Access Interceptor",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };
}

export default AccessInterceptor;
