import { Connection } from "mongoose";
import {
  IProductBrandMigration,
  IProductImageMigration,
  IProductMigration,
  IProductTypeMigration,
  IUserMigration,
} from "../interfaces/migration.interface";
import { MigrationModel } from "../models/migration.model";

/**
 * Antrian perintah SQL untuk aplikasi kasir.
 *
 * Setiap perubahan pada produk dan pengguna di sisi server dicatat di sini
 * sebagai satu baris SQL. Aplikasi kasir menarik baris yang lebih baru dari
 * versi terakhir yang ia punya, lalu menjalankannya pada SQLite lokalnya.
 *
 * PERINTAHNYA MASIH DIRANGKAI DENGAN PENGGABUNGAN STRING.
 *
 * Nilai seperti nama produk dan deskripsi dimasukkan langsung ke dalam
 * perintah tanpa di-escape, jadi satu tanda kutip tunggal pada nama produk
 * sudah cukup untuk merusak — atau mengubah — perintah yang dijalankan di
 * perangkat kasir. Ini dipindahkan APA ADANYA karena refactor ini tidak
 * mengubah perilaku; perbaikannya butuh keputusan tersendiri (escape yang
 * benar, atau berhenti mengirim SQL mentah dan mengirim data terstruktur).
 *
 * NOMOR VERSI MEMAKAI Date.now().
 *
 * Dua migrasi yang dibuat pada milidetik yang sama akan punya nomor yang
 * sama, dan aplikasi kasir menarik dengan `$gt`, sehingga salah satunya bisa
 * terlewat. createProduct() malah membuat beberapa baris sekaligus dalam satu
 * putaran. updateProductImages() sudah menyiasatinya dengan menambah indeks
 * ke nomor versi; yang lain belum. Dipertahankan apa adanya.
 */
export class MigrationRepository {
  private conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  private get collection() {
    return this.conn.model("migrations");
  }

  /** Nomor versi tertinggi, atau null kalau antriannya masih kosong. */
  async fetchLatestVersion(): Promise<MigrationModel | null> {
    try {
      const result = await this.collection.aggregate([
        { $sort: { migration_version: -1 } },
        { $limit: 1 },
      ]);

      return result.length > 0 ? MigrationModel.fromMap(result[0]) : null;
    } catch (error) {
      console.error(`[error]: Error on fetching latest migration: ${error}`);
      throw error;
    }
  }

  /**
   * Semua perintah yang lebih baru dari versi yang dipegang pemanggil.
   *
   * Tidak diurutkan, sama seperti sebelumnya — urutan yang dikembalikan
   * MongoDB tanpa sort tidak dijamin, padahal perintah SQL jelas peka urutan.
   * Ini cacat yang diketahui dan sengaja belum disentuh di sini.
   */
  async fetchSince(version: number): Promise<MigrationModel[]> {
    try {
      const rows = await this.collection.find({
        migration_version: { $gt: version },
      });

      return rows.map((row) => MigrationModel.fromMap(row));
    } catch (error) {
      console.error(`[error]: Error on fetching migration: ${error}`);
      throw error;
    }
  }

  /** Menulis satu perintah baru ke antrian. */
  private enqueue(command: string, versionOffset = 0) {
    return this.collection.create({
      migration_version: new Date().getTime() + versionOffset,
      command: command,
    });
  }

  createProduct(data: IProductMigration) {
    return Promise.all([
      this.enqueue(
        `INSERT OR IGNORE INTO product (reference, description, brand, type, brandID, typeID, price, barcode, mongoID, isActive) VALUES ('${
          data.reference
        }','${data.description}','${data.brand}','${data.type}','${
          data.brandID
        }','${data.typeID}',${data.price},'${data.barcode}','${data.id}', ${
          data.isActive ? 1 : 0
        });`
      ),
      ...data.images.map((x) =>
        this.enqueue(
          `INSERT OR IGNORE INTO product_image (productID, imageUrl) VALUES ('${data.id}', '${x}');`
        )
      ),
    ]);
  }

  updateProduct(data: IProductMigration) {
    return this.enqueue(
      `UPDATE product SET reference = '${data.reference}', description = '${
        data.description
      }', isActive = ${data.isActive ? 1 : 0}, barcode = '${
        data.barcode
      }', brandID = '${data.brandID}', typeID = '${data.typeID}', price=${
        data.price
      }, type = '${data.type}', brand = '${data.brand}' WHERE mongoID = '${
        data.id
      }';`
    );
  }

  deleteProduct(productID: string) {
    return this.enqueue(
      `DELETE FROM product WHERE mongoID = '${productID}';`
    );
  }

  updateProductBrand(data: IProductBrandMigration) {
    return this.enqueue(
      `UPDATE product SET brand = '${data.name}' WHERE brandID = '${data.id}';`
    );
  }

  updateProductType(data: IProductTypeMigration) {
    return this.enqueue(
      `UPDATE product SET type = '${data.name}' WHERE typeID = '${data.id}';`
    );
  }

  /**
   * Menambahkan indeks ke nomor versi supaya beberapa gambar yang ditulis
   * dalam satu putaran tidak berebut nomor yang sama.
   */
  updateProductImages(data: IProductImageMigration) {
    return this.collection.insertMany(
      data.images.map((x, index) => ({
        migration_version: new Date().getTime() + index,
        command:
          "INSERT INTO product_image (productID, imageUrl) VALUES ('" +
          data.id +
          "', '" +
          x +
          "')",
      }))
    );
  }

  deleteProductImage(path: string, productID: string) {
    return this.enqueue(
      `DELETE FROM product_image WHERE productID = '${productID}' AND imageUrl = '${path}';`
    );
  }

  createUser(data: IUserMigration) {
    return this.enqueue(
      `INSERT OR IGNORE INTO user (name, code, userID) VALUES ('${data.name}', '${data.code}', '${data.userID}');`
    );
  }

  updateUser(data: IUserMigration) {
    return this.enqueue(
      `UPDATE user SET code = '${data.code}', name = '${data.name}' WHERE userID = '${data.userID}';`
    );
  }

  deleteUser(userID: string) {
    return this.enqueue(`DELETE FROM user WHERE userID = '${userID}';`);
  }
}

export default MigrationRepository;
