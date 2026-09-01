import { IMigration } from "../interfaces/migration.interface";

/**
 * Satu baris antrian migrasi sebagai objek data murni.
 *
 * Query-nya sekarang tinggal di repositories/migration.repository.ts.
 */
export class MigrationModel {
  _id?: string;
  migration_version: number;
  command: string;

  constructor(data: IMigration) {
    this._id = data._id;
    this.migration_version = data.migration_version;
    this.command = data.command;
  }

  static fromMap(data: any): MigrationModel {
    return new MigrationModel({
      _id: data._id?.toString(),
      migration_version: data.migration_version,
      command: data.command,
    });
  }
}

export default MigrationModel;
