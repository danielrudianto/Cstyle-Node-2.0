import MigrationModel from "../schemas/impl.migration.model";
import {
  ProductBrandMigrationInterface,
  ProductImageMigrationInterface,
  ProductMigrationInterface,
  ProductTypeMigrationInterface,
  UserMigrationInterface,
} from "../interfaces/migration.interface";
import { connectionFactory } from "../utils/connector.utils";

const conn = connectionFactory();

class MigrationModelModel {
  static fetchLatestVersion() {
    return conn.model("migration").findOne({
      order: [["migration_version", "DESC"]],
    });
  }

  static fetchMigrationSince(version: number) {
    return conn.model("migration").find({
      where: {
        migration_version: {
          $gt: version,
        },
      },
      orderBy: [["migration_version", "DESC"]],
    });
  }

  static deleteProduct(productID: string) {
    return conn.model("migration").create({
      // Autoincrement from previous
      migration_version: new Date().getTime(),
      command: `DELETE FROM product WHERE mongoID = '${productID}';`,
    });
  }

  static deleteProductImage(path: string, productID: string) {
    return conn.model("migration").create({
      // Autoincrement from previous
      migration_version: new Date().getTime(),
      command: `DELETE FROM product_image WHERE productID = '${productID}' AND imageUrl = '${path}';`,
    });
  }

  static createProduct(data: ProductMigrationInterface) {
    return Promise.all([
      conn.model("migration").create({
        // Autoincrement from previous
        migration_version: new Date().getTime(),
        command: `INSERT INTO product (reference, description, brand, type, brandID, typeID, price, barcode, mongoID) VALUES ('${data.reference}','${data.description}','${data.brand}','${data.type}','${data.brandID}','${data.typeID}','${data.price}','${data.barcode},'${data.id}');`,
      }),
      ...data.images.map((x) => {
        return conn.model("migration").create({
          // Autoincrement from previous
          migration_version: new Date().getTime(),
          command: `INSERT INTO product_image (productID, imageUrl) VALUES ('${data.id}', '${x}');`,
        });
      }),
    ]);
  }

  static updateProduct(data: ProductMigrationInterface) {
    if (data.isActive) {
      return conn.model("migration").create({
        migration_version: new Date().getTime(),
        command: `UPDATE product SET reference = '${data.reference}', description = '${data.description}' WHERE mongoID = '${data.id}';`,
      });
    } else {
      return conn.model("migration").create({
        migration_version: new Date().getTime(),
        command: `DELETE FROM product WHERE mongoID = '${data.id}';`,
      });
    }
  }

  static updateProductBrand(data: ProductBrandMigrationInterface) {
    return conn.model("migration").create({
      // Autoincrement from previous
      migration_version: new Date().getTime(),
      command: `UPDATE product SET brand = '${data.name}' WHERE brandID = '${data.id}';`,
    });
  }

  static updateProductType(data: ProductTypeMigrationInterface) {
    return conn.model("migration").create({
      // Autoincrement from previous
      migration_version: new Date().getTime(),
      command: `UPDATE product SET type = '${data.name}' WHERE typeID = '${data.id}';`,
    });
  }

  static createUser(data: UserMigrationInterface) {
    return conn.model("migration").create({
      migration_version: new Date().getTime(),
      command: `INSERT INTO user (name, code, userID) VALUES ('${data.name}', '${data.code}', '${data.userID}');`,
    });
  }

  static updateUser(data: UserMigrationInterface) {
    return conn.model("migration").create({
      // Autoincrement from previous
      migration_version: new Date().getTime(),
      command: `UPDATE user SET code = '${data.code}', name = '${data.name} WHERE userID = '${data.userID}';`,
    });
  }

  static deleteUser(userID: number) {
    return conn.model("migration").create({
      // Autoincrement from previous
      migration_version: new Date().getTime(),
      command: `DELETE FROM user WHERE userID = '${userID}';`,
    });
  }

  static updateProductImages(data: ProductImageMigrationInterface) {
    return conn.model("migration").insertMany(
      data.images.map((x, index) => {
        return {
          migration_version: new Date().getTime() + index,
          command:
            "INSERT INTO product_image (productID, imageUrl) VALUES ('" +
            data.id +
            "', '" +
            x +
            "')",
        };
      })
    );
  }
}

export default MigrationModelModel;
