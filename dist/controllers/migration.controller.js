"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_interface_1 = require("../interfaces/logger.interface");
const user_model_1 = __importDefault(require("../models/user.model"));
const item_model_1 = __importDefault(require("../models/item.model"));
const migration_model_1 = __importDefault(require("../models/migration.model"));
const logger_utils_1 = __importDefault(require("../utils/logger.utils"));
const error_list_1 = require("../data/error-list");
class MigrationController {
}
MigrationController.sync = (req, res) => {
    const last_migration_version = req.body.last_migration_version;
    if (last_migration_version == 0) {
        Promise.all([
            user_model_1.default.fetchInitial(),
            item_model_1.default.fetchInitial(),
            migration_model_1.default.fetchLatestVersion(),
        ])
            .then(([user, products, migration_version]) => {
            const commands = [];
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
              '${x.itemBrandID == null
                    ? ""
                    : x.itemBrandID.name.replace("'", "''")}',
              '${x.itemTypeID == null ? "" : x.itemTypeID.name.replace("'", "''")}',
              '${x.itemBrandID == null ? "" : x.itemBrandID._id}',
              '${x.itemTypeID == null ? "" : x.itemTypeID._id}',
              '${x._id}'
          );`);
                x.images.forEach((image) => {
                    commands.push(`INSERT INTO product_image (productID, imageUrl) VALUES ('${x._id}', '${process.env.BASE_URL}${image}');`);
                });
            });
            return res.status(200).send({
                migrationVersion: migration_version == null
                    ? -1
                    : migration_version.migration_version,
                commands: [
                    ...commands,
                    ...user.map((x) => {
                        return `INSERT INTO user (userID, code, name) VALUES ('${x._id}', '${x.code}', '${x.name}');`;
                    }),
                ],
            });
        })
            .catch((error) => {
            new logger_utils_1.default({
                type: logger_interface_1.LoggerType.error,
                message: `Error on fetching initial data ${error}`,
                tag: "Migration",
            }).log();
            return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    }
    else {
        migration_model_1.default.fetchMigrationSince(last_migration_version)
            .then((result) => {
            if (result.length == 0) {
                return res.status(200).send({
                    migrationVersion: last_migration_version,
                    commands: [],
                });
            }
            else {
                return res.status(200).send({
                    migrationVersion: result[0].migration_version,
                    commands: result.map((x) => {
                        return x.command;
                    }),
                });
            }
        })
            .catch((error) => {
            new logger_utils_1.default({
                type: logger_interface_1.LoggerType.error,
                message: `Error on fetching migration data ${error}`,
                tag: "Migration",
            }).log();
            return res.status(500).send(error_list_1.ErrorList["INTERNAL_SERVER_ERROR"]);
        });
    }
};
exports.default = MigrationController;
//# sourceMappingURL=migration.controller.js.map