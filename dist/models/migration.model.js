"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connector_utils_1 = require("../utils/connector.utils");
const conn = (0, connector_utils_1.connectionFactory)();
class MigrationModelModel {
    static fetchLatestVersion() {
        return conn.model("migrations").findOne().sort({ migration_version: -1 });
    }
    static fetchMigrationSince(version) {
        return conn.model("migrations").find({
            migration_version: {
                $gt: version,
            },
        });
    }
    static deleteProduct(productID) {
        return conn.model("migrations").create({
            migration_version: new Date().getTime(),
            command: `DELETE FROM product WHERE mongoID = '${productID}';`,
        });
    }
    static deleteProductImage(path, productID) {
        return conn.model("migrations").create({
            migration_version: new Date().getTime(),
            command: `DELETE FROM product_image WHERE productID = '${productID}' AND imageUrl = '${path}';`,
        });
    }
    static createProduct(data) {
        return Promise.all([
            conn.model("migrations").create({
                migration_version: new Date().getTime(),
                command: `INSERT INTO product (reference, description, brand, type, brandID, typeID, price, barcode, mongoID, isActive) VALUES ('${data.reference}','${data.description}','${data.brand}','${data.type}','${data.brandID}','${data.typeID}','${data.price}','${data.barcode},'${data.id}', ${data.isActive ? 1 : 0});`,
            }),
            ...data.images.map((x) => {
                return conn.model("migrations").create({
                    migration_version: new Date().getTime(),
                    command: `INSERT INTO product_image (productID, imageUrl) VALUES ('${data.id}', '${x}');`,
                });
            }),
        ]);
    }
    static updateProduct(data) {
        return conn.model("migrations").create({
            migration_version: new Date().getTime(),
            command: `UPDATE product SET reference = '${data.reference}', description = '${data.description}', isActive = ${data.isActive ? 1 : 0}, barcode = '${data.barcode}', brandID = '${data.brandID}', typeID = '${data.typeID}', type = '${data.type}', brand = '${data.brand}' WHERE mongoID = '${data.id}';`,
        });
    }
    static updateProductBrand(data) {
        return conn.model("migrations").create({
            migration_version: new Date().getTime(),
            command: `UPDATE product SET brand = '${data.name}' WHERE brandID = '${data.id}';`,
        });
    }
    static updateProductType(data) {
        return conn.model("migrations").create({
            migration_version: new Date().getTime(),
            command: `UPDATE product SET type = '${data.name}' WHERE typeID = '${data.id}';`,
        });
    }
    static createUser(data) {
        return conn.model("migrations").create({
            migration_version: new Date().getTime(),
            command: `INSERT INTO user (name, code, userID) VALUES ('${data.name}', '${data.code}', '${data.userID}');`,
        });
    }
    static updateUser(data) {
        return conn.model("migrations").create({
            migration_version: new Date().getTime(),
            command: `UPDATE user SET code = '${data.code}', name = '${data.name} WHERE userID = '${data.userID}';`,
        });
    }
    static deleteUser(userID) {
        return conn.model("migrations").create({
            migration_version: new Date().getTime(),
            command: `DELETE FROM user WHERE userID = '${userID}';`,
        });
    }
    static updateProductImages(data) {
        return conn.model("migrations").insertMany(data.images.map((x, index) => {
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