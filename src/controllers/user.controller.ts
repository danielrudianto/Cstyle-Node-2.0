import { hash } from "bcrypt";
import { Request, Response } from "express";
import { ErrorList } from "../data/error-list";
import { redisClient } from "../app";
import { LoggerType } from "../interfaces/logger.interface";
import UserModelModel from "../models/user.model";
import LoggerHelper from "../utils/logger.utils";
import UserSalesModel from "../models/user-sales.model";
import { queue } from "../utils/queue.utils";

class UserController {
  static create = (req: Request, res: Response) => {
    const name = req.body.name;
    const username = req.body.username;
    const accessLevel = req.body.accessLevel;
    const code = req.body.code;
    const createdBy = req.body.userID;

    UserModelModel.preCreate(username, code)
      .then((validation) => {
        if (!validation) {
          return res.status(400).send(ErrorList["USERNAME_ALREADY_EXISTS"]);
        } else {
          const password = this.generateRandomPassword();
          hash(password, 12)
            .then((hashedPassword) => {
              new UserModelModel({
                name: name,
                code: code,
                username: username,
                password: hashedPassword,
                accessLevel: accessLevel,
                createdBy: createdBy,
                createdAt: new Date(),
                isActive: true,
              })
                .create()
                .then(async (result) => {
                  await redisClient.set(
                    `users:${result._id}`,
                    JSON.stringify(result)
                  );

                  await queue.add("createUser", {
                    id: result._id,
                  });

                  return res.status(201).send({
                    password: password,
                  });
                })
                .catch((error) => {
                  new LoggerHelper({
                    message: `Error on creating user ${error}`,
                    type: LoggerType.error,
                    tag: "User",
                  }).log();
                  return res
                    .status(500)
                    .send(ErrorList["INTERNAL_SERVER_ERROR"]);
                });
            })
            .catch((error) => {
              new LoggerHelper({
                message: `Error on hashing user password ${error}`,
                type: LoggerType.error,
                tag: "User",
              }).log();
              return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on checking user ${error}`,
          type: LoggerType.error,
          tag: "User",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetch = (req: Request, res: Response) => {
    const keyword =
      req.query.keyword == undefined || req.query.keyword == null
        ? ""
        : req.query.keyword.toString();
    const page =
      req.query.page == undefined || req.query.page == null
        ? 1
        : parseInt(req.query.page.toString());

    UserModelModel.fetch({
      keyword: keyword,
      page: page,
    })
      .then(([result, count]) => {
        return res.status(200).send({
          data: result,
          count: count,
        });
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching user ${error}`,
          type: LoggerType.error,
          tag: "User",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchSales = (req: Request, res: Response) => {
    const keyword = req.query.keyword as string;
    UserSalesModel.fetchAutocomplete(keyword)
      .then((result) => {
        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching sales user ${error}`,
          tag: "error",
          type: LoggerType.error,
        }).log();

        return res.status(500).send(error);
      });
  };

  static fetchByID = (req: Request, res: Response) => {
    const id = req.params.id;
    UserModelModel.fetchByID(id)
      .then((result) => {
        if (!result) {
          return res.status(404).send(ErrorList["USER_NOT_FOUND"]);
        }

        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching user ${error}`,
          type: LoggerType.error,
          tag: "User",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static updateByID = (req: Request, res: Response) => {
    const id = req.body.id;
    const name = req.body.name;
    const username = req.body.username;
    const accessLevel = req.body.accessLevel;
    const code = req.body.code;

    UserModelModel.preUpdate(username, code, id)
      .then((validation) => {
        if (!validation) {
          return res.status(400).send(ErrorList["USERNAME_ALREADY_EXISTS"]);
        } else {
          new UserModelModel({
            name: name,
            username: username,
            accessLevel: accessLevel,
            code: code,
            _id: id,
            isActive: true,
          })
            .update()
            .then(async (result) => {
              await redisClient.set(
                `users:${result._id}`,
                JSON.stringify({
                  name: name,
                  username: username,
                  accessLevel: accessLevel,
                  code: code,
                  _id: id,
                  isActive: true,
                })
              );

              await queue.add("updateUser", {
                id: result._id,
              });

              return res.status(200).send(result);
            })
            .catch((error) => {
              new LoggerHelper({
                message: `Error on updating user ${error}`,
                type: LoggerType.error,
                tag: "User",
              }).log();
              return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on pre updating user ${error}`,
          type: LoggerType.error,
          tag: "User",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static resetPassword = (req: Request, res: Response) => {
    const userID = req.body.id;
    UserModelModel.fetchByID(userID)
      .then((user) => {
        if (!user || !user.isActive) {
          return res.status(404).send(ErrorList["USER_NOT_FOUND"]);
        } else {
          const password = this.generateRandomPassword();
          hash(password, 12)
            .then((hashedPassword) => {
              new UserModelModel({
                _id: userID,
                password: hashedPassword,
                name: user.name,
                username: user.username,
                isActive: user.isActive,
                code: user.code,
                accessLevel: user.accessLevel,
              })
                .update()
                .then((_) => {
                  return res.status(201).send({
                    password: password,
                  });
                })
                .catch((error) => {
                  new LoggerHelper({
                    message: `Error on updating user ${error}`,
                    type: LoggerType.error,
                    tag: "User",
                  }).log();
                  return res
                    .status(500)
                    .send(ErrorList["INTERNAL_SERVER_ERROR"]);
                });
            })
            .catch((error) => {
              new LoggerHelper({
                message: `Error on hashing password ${error}`,
                type: LoggerType.error,
                tag: "User",
              }).log();
              return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
            });
        }
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on fetching user ${error}`,
          type: LoggerType.error,
          tag: "User",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static deleteByID = (req: Request, res: Response) => {
    const id = req.params.id;
    const userID = req.body.userID;
    UserModelModel.deleteByID(id, userID)
      .then(async (result) => {
        await redisClient.del(`users:${result._id}`);

        await queue.add("deleteUser", {
          id: result._id,
        });

        return res.status(200).send(result);
      })
      .catch((error) => {
        new LoggerHelper({
          message: `Error on deleting user ${error}`,
          type: LoggerType.error,
          tag: "User",
        }).log();
        return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
      });
  };

  static fetchByCode = (req: Request, res: Response) => {
    // const code = req.params.code;
    // UserModel.findOne({
    //   code: code,
    //   isActive: true,
    // })
    //   .then((user) => {
    //     if (!user) {
    //       return res.status(404).send(ErrorList["USER_NOT_FOUND"]);
    //     }
    //     return res.status(200).send(user);
    //   })
    //   .catch((error) => {
    //     console.error(`[error]: Error on fetching user ${error}`);
    //     return res.status(500).send(error);
    //   });
  };

  static generateRandomPassword(): string {
    let password = "";
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 8) {
      password += characters.charAt(
        Math.floor(Math.random() * charactersLength)
      );
      counter += 1;
    }

    return password;
  }
}

export default UserController;
