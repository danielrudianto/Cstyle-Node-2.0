import { Request, Response } from "express";
import { LoggerType } from "../interfaces/logger.interface";
import UserModelModel from "../models/user.model";
import ItemModelModel from "../models/item.model";
import MigrationModelModel from "../models/migration.model";
import LoggerHelper from "../utils/logger.utils";
import { ErrorList } from "../data/error-list";

class MigrationController {
  static sync = (req: Request, res: Response) => {
    const last_migration_version = req.body.last_migration_version;
    if (last_migration_version == 0) {
      // The user has never run the migration
      Promise.all([
        UserModelModel.fetchInitial(),
        ItemModelModel.fetchInitial(),
        MigrationModelModel.fetchLatestVersion(),
      ])
        .then(([user, products, migration_version]) => {
          const commands: string[] = [];
          products.forEach((x) => {
            commands.push(`INSERT INTO product (
              reference,
              description,
              price,
              barcode,
              brand,
              type,
              brandID,
              typeID,
              mongoID
          ) VALUES(
              '${x.reference.replace("'", "''")}',
              '${x.description.replace("'", "''")}',
              ${x.price},
              '${x.barcode}',
              '${x.itemBrandID.name.replace("'", "''")}',
              '${x.itemTypeID.name.replace("'", "''")}',
              '${x.itemBrandID._id}',
              '${x.itemTypeID._id}',
              '${x._id}'
          );`);

            x.images.forEach((image: string) => {
              commands.push(
                `INSERT INTO product_image (productID, imageUrl) VALUES ('${x._id}', '${process.env.BASE_URL}${image}');`
              );
            });
          });
          return res.status(200).send({
            migrationVersion:
              migration_version == null ? -1 : migration_version,
            commands: [
              ...commands,
              ...user!.map((x) => {
                return `INSERT INTO user (userID, code, name) VALUES ('${x._id!}', '${
                  x.code
                }', '${x.name}');`;
              }),
            ],
          });
        })
        .catch((error) => {
          new LoggerHelper({
            type: LoggerType.error,
            message: `Error on fetching initial data ${error}`,
            tag: "Migration",
          }).log();

          return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    } else {
      MigrationModelModel.fetchMigrationSince(last_migration_version)
        .then((result) => {
          if (result.length == 0) {
            return res.status(200).send({
              migrationVersion: last_migration_version,
              commands: [],
            });
          } else {
            // last version
            return res.status(200).send({
              migrationVersion: result[0].migration_version,
              commands: result.map((x) => {
                return x.command;
              }),
            });
          }
        })
        .catch((error) => {
          new LoggerHelper({
            type: LoggerType.error,
            message: `Error on fetching migration data ${error}`,
            tag: "Migration",
          }).log();
          return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    }
  };
}

export default MigrationController;
