import { NextFunction, Request, Response } from "express";
import * as JWT from "jsonwebtoken";
import { ErrorList } from "../data/error-list";
import { redisClient } from "../app";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();

class AuthInterceptor {
  static intercept = (req: Request, res: Response, next: NextFunction) => {
    if (
      req.headers["authorization"] == undefined ||
      req.headers["authorization"] == null
    ) {
      return res.status(401).send("Token unrecognized.");
    }

    const bearerToken = req.headers["authorization"].toString();
    const componentToken = bearerToken.split(" ");
    if (componentToken.length == 2) {
      const token = componentToken[1];
      try {
        const decoded = JWT.verify(token, process.env.AUTHORIZATION_KEY!);
        const userID = (decoded as any).id;
        redisClient.get(`users:${userID}`).then((user) => {
          if (!user) {
            return res.status(401).send("Token unrecognized.");
          }

          const parsedUser = JSON.parse(user);

          if (parsedUser.isActive == false) {
            return res.status(401).send("User is inactive.");
          }

          req.body.userID = userID;
          next();
        });
      } catch (error) {
        console.error(`[error]: Error on verifying token: ${error}`);
        return res.status(401).send("Token already expired.");
      }
    } else {
      return res.status(401).send("Token unrecognized.");
    }
  };

  static anyIntercept = (req: Request, res: Response, next: NextFunction) => {
    // Request from cashier application
    // User have to send storeUID, since it is stored in the SharedPreference of the application
    // And for certain cases, user have to send the Employee Code
    if (
      req.headers["authorization"] == undefined ||
      req.headers["authorization"] == null
    ) {
      const storeUID = req.headers["store"];
      if (storeUID == undefined || storeUID == null || storeUID == "") {
        return res.status(401).send("Token unrecognized.");
      } else {
        // Format storeUID from string with 32 length to UID format
        const formattedUID =
          storeUID.toString().substring(0, 8) +
          "-" +
          storeUID.toString().substring(8, 12) +
          "-" +
          storeUID.toString().substring(12, 16) +
          "-" +
          storeUID.toString().substring(16, 20) +
          "-" +
          storeUID.toString().substring(20, 32);

        conn
          .model("stores")
          .find({
            code: formattedUID,
            isActive: true,
          })
          .then((stores) => {
            if (stores.length == 0) {
              return res.status(401).send("Token unrecognized.");
            } else {
              req.body.storeID = stores[0]._id;
              next();
            }
          });
      }

      const employeeCode = req.headers["employee-code"];
      if (employeeCode != undefined && employeeCode != null) {
        conn
          .model("users")
          .find({
            code: employeeCode,
            isActive: true,
          })
          .then((user) => {
            if (user.length == 0) {
              return res.status(401).send("Token unrecognized.");
            } else {
              req.body.employeeID = user[0]._id;
              next();
            }
          });
      }
    } else {
      const bearerToken = req.headers["authorization"].toString();
      const componentToken = bearerToken.split(" ");
      if (componentToken.length == 2) {
        const token = componentToken[1];
        try {
          const decoded = JWT.verify(token, process.env.AUTHORIZATION_KEY!);
          const userID = (decoded as any).id;
          req.body.userID = userID;
          next();
        } catch (error) {
          return res.status(401).send("Token already expired.");
        }
      } else {
        return res.status(401).send("Token unrecognized.");
      }
    }
  };

  /**
   * Administrator intercept
   * @param req
   * @param res
   * @param next
   */
  static administratorInterceptor = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userID = req.body.userID;
    redisClient
      .get(`users:${userID}`)
      .then((user) => {
        if (!user) {
          return res.status(401).send(ErrorList["USER_NOT_FOUND"]);
        }

        const parsedUser = JSON.parse(user);

        if (parsedUser.accessLevel == 4 || parsedUser.accessLevel == 1) {
          return next();
        }

        return res.status(401).send(ErrorList["ADMINISTRATOR_ONLY"]);
      })
      .catch((error) => {
        console.error(
          `[error]: Error on intercepting authentication for administrator ${error}`
        );
        return res.status(500).send(error);
      });
  };

  static administratorOnlyInterceptor = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userID = req.body.userID;
    conn
      .model("users")
      .findById(userID)
      .then((user) => {
        if (user == null) {
          return res.status(401).send(ErrorList["USER_NOT_FOUND"]);
        }
        if (user.accessLevel == 4) {
          next();
        } else {
          return res.status(401).send(ErrorList["ADMINISTRATOR_ONLY"]);
        }
      });
  };
}

export default AuthInterceptor;
