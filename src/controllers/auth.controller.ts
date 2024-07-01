import { compare, hash } from "bcrypt";
import { Request, Response } from "express";
import JWT from "jsonwebtoken";
import { ErrorList } from "../data/error-list";
import { connectionFactory } from "../utils/connector.utils";
import UserModelModel from "../models/user.model";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";
import { queue } from "../utils/queue.utils";

const conn = connectionFactory();

class AuthController {
  static login = (req: Request, res: Response) => {
    const username = req.body.username;
    const password = req.body.password;

    UserModelModel.fetchByUsername(username)
      .then((user) => {
        if (user == null || !user.isActive) {
          return res.status(404).send(ErrorList["LOGIN_ERROR"]);
        } else {
          compare(password, user.password as string).then(
            async (validation) => {
              if (!validation) {
                return res.status(404).send(ErrorList["LOGIN_ERROR"]);
              } else {
                await queue.add("login", user._id);
                const token = this.generateAccessToken(user._id!, user.name);
                const refreshToken = this.generateRefreshToken(user._id!);
                return res.status(200).send({
                  id: user._id,
                  name: user.name,
                  accessLevel: user.accessLevel,
                  token: token,
                  refreshToken: refreshToken,
                });
              }
            }
          );
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching user ${error}`,
          type: LoggerType.error,
          tag: "Authentication",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static generateAccessToken(userID: string, name: string): string {
    return JWT.sign(
      {
        id: userID,
        name: name,
      },
      process.env.AUTHORIZATION_KEY!,
      {
        expiresIn: "8h",
      }
    );
  }

  static generateRefreshToken(userID: string) {
    return JWT.sign(
      {
        id: userID,
      },
      process.env.REFRESH_AUTHORIZATION_KEY!,
      {
        expiresIn: "7d",
      }
    );
  }

  static refreshToken = (req: Request, res: Response) => {
    if (req.headers["x-token"] == undefined || req.headers["x-token"] == null) {
      return res.status(401).send("Token unrecognized.");
    } else {
      const bearerToken = req.headers["x-token"].toString();
      const componentToken = bearerToken.split(" ");
      if (componentToken.length == 2) {
        const token = componentToken[1];
        try {
          const decoded = JWT.verify(
            token,
            process.env.REFRESH_AUTHORIZATION_KEY!
          );
          const userID = (decoded as any).id;
          conn
            .model("users")
            .findById(userID)
            .then((user) => {
              if (user == null || !user.isActive) {
                return res.status(400).send("User not recognized");
              } else {
                return res.status(200).send({
                  token: JWT.sign(
                    {
                      id: user.id,
                      name: user.name,
                    },
                    process.env.AUTHORIZATION_KEY!,
                    {
                      expiresIn: "8h",
                    }
                  ),
                });
              }
            });
        } catch (error) {
          return res.status(401).send("Token already expired.");
        }
      } else {
        return res.status(401).send("Token unrecognized.");
      }
    }
  };

  static fetchProfile = (req: Request, res: Response) => {
    const userID = req.body.userID;
    conn
      .model("users")
      .findById(userID)
      .then((user) => {
        if (!user) {
          return res.status(404).send(ErrorList["USER_NOT_FOUND"]);
        }

        if (!user.isActive) {
          return res.status(404).send(ErrorList["USER_NOT_FOUND"]);
        }

        return res.status(200).send({
          id: user.id,
          name: user.name,
          accessLevel: user.accessLevel,
          code: user.code,
          username: user.username,
          isActive: user.isActive,
          createdAt: user.createdAt,
        });
      });
  };

  static updatePassword = (req: Request, res: Response) => {
    const userID = req.body.userID;
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    conn
      .model("users")
      .findById(userID)
      .then((user) => {
        compare(oldPassword, user!.password)
          .then((value) => {
            if (!value) {
              return res.status(401).send("Invalid old password.");
            }

            hash(newPassword, 12)
              .then((hashedPassword) => {
                conn
                  .model("users")
                  .findByIdAndUpdate(userID, {
                    password: hashedPassword,
                  })
                  .then(() => {
                    return res.status(201).send(user);
                  })
                  .catch((error) => {
                    return res.status(500).send(error);
                  });
              })
              .catch((error) => {
                console.error(`[error]: Error on hashing password: ${error}`);
                return res.status(500).send(error);
              });
          })
          .catch((error) => {
            console.error(`[error]: Error on comparing password: ${error}`);
            return res.status(401).send("Invalid old password.");
          });
      })
      .catch((error) => {
        console.error(`[error]: Error on finding user: ${error}`);
        return res.status(500).send(error);
      });
  };
}

export default AuthController;
