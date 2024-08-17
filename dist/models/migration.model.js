"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class MigrationModelModel {
    static fetchLatestVersion() {
        return conn.model("migration").findOne({
            order: [["migration_version", "DESC"]],
        });
    }
    static fetchMigrationSince(version) {
        return conn.model("migration").find({
            where: {
                migration_version: {
                    $gt: version,
                },
            },
            orderBy: [["migration_version", "DESC"]],
        });
    }
    static deleteProduct(productID) {
        return conn.model("migration").create({
            migration_version: new Date().getTime(),
            command: `DELETE FROM product WHERE mongoID = '${productID}';`,
        });
    }
    static deleteProductImage(path, productID) {
        return conn.model("migration").create({
            migration_version: new Date().getTime(),
            command: `DELETE FROM product_image WHERE productID = '${productID}' AND imageUrl = '${path}';`,
        });
    }
    static createProduct(data) {
        return Promise.all([
            conn.model("migration").create({
                migration_version: new Date().getTime(),
                command: `INSERT INTO product (reference, description, brand, type, brandID, typeID, price, barcode, mongoID, isActive) VALUES ('${data.reference}','${data.description}','${data.brand}','${data.type}','${data.brandID}','${data.typeID}','${data.price}','${data.barcode},'${data.id}', ${data.isActive ? 1 : 0});`,
            }),
            ...data.images.map((x) => {
                return conn.model("migration").create({
                    migration_version: new Date().getTime(),
                    command: `INSERT INTO product_image (productID, imageUrl) VALUES ('${data.id}', '${x}');`,
                });
            }),
        ]);
    }
    static updateProduct(data) {
        return conn.model("migration").create({
            migration_version: new Date().getTime(),
            command: `UPDATE product SET reference = '${data.reference}', description = '${data.description}', isActive = ${data.isActive ? 1 : 0} WHERE mongoID = '${data.id}';`,
        });
    }
    static updateProductBrand(data) {
        return conn.model("migration").create({
            migration_version: new Date().getTime(),
            command: `UPDATE product SET brand = '${data.name}' WHERE brandID = '${data.id}';`,
        });
    }
    static updateProductType(data) {
        return conn.model("migration").create({
            migration_version: new Date().getTime(),
            command: `UPDATE product SET type = '${data.name}' WHERE typeID = '${data.id}';`,
        });
    }
    static createUser(data) {
        return conn.model("migration").create({
            migration_version: new Date().getTime(),
            command: `INSERT INTO user (name, code, userID) VALUES ('${data.name}', '${data.code}', '${data.userID}');`,
        });
    }
    static updateUser(data) {
        return conn.model("migration").create({
            migration_version: new Date().getTime(),
            command: `UPDATE user SET code = '${data.code}', name = '${data.name} WHERE userID = '${data.userID}';`,
        });
    }
    static deleteUser(userID) {
        return conn.model("migration").create({
            migration_version: new Date().getTime(),
            command: `DELETE FROM user WHERE userID = '${userID}';`,
        });
    }
    static updateProductImages(data) {
        return conn.model("migration").insertMany(data.images.map((x, index) => {
            return {
                migration_version: new Date().getTime() + index,
                command: "INSERT INTO product_image (productID, imageUrl) VALUES ('" +
                    data.id +
                    "', '" +
                    x +
                    "')",
            };
        }));
    }
}
exports.default = MigrationModelModel;
//# sourceMappingURL=migration.model.js.map