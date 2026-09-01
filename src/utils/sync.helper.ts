import { redisClient } from "../app";
import { LoggerType } from "../interfaces/logger.interface";
import { UserRepository } from "../repositories/user.repository";
import { conn } from "./database.helper";
import LoggerHelper from "./logger.helper";

/**
 * Mengisi cache Redis saat proses dinyalakan.
 *
 * auth.interceptor membaca `users:<id>` dari Redis pada setiap permintaan
 * yang butuh autentikasi, jadi cache ini WAJIB terisi sebelum pengguna bisa
 * masuk. Kalau Redis dikosongkan saat proses sedang jalan, seluruh pengguna
 * akan tertolak sampai proses dinyalakan ulang — pengisiannya hanya terjadi
 * sekali di sini, tidak ada penyegaran berkala.
 */
class SyncUtils {
  private static userRepository = new UserRepository(conn);

  static initiate() {
    this.syncUser();
  }

  static async syncUser() {
    try {
      const users = await this.userRepository.fetchActive();

      /*
        Ditulis berurutan dan DITUNGGU sampai selesai. Kode lama memakai
        forEach dengan callback async, sehingga pesan "Synced N users" tercetak
        sebelum satu pun kunci benar-benar tertulis, dan kegagalan penulisan
        tidak terlihat sama sekali.
      */
      for (const user of users) {
        await redisClient.SET(`users:${user._id}`, JSON.stringify(user));
      }

      new LoggerHelper({
        message: `Synced ${users.length} users`,
        type: LoggerType.info,
        tag: "Sync",
      }).log();
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching users ${error}`,
        type: LoggerType.error,
        tag: "Sync",
      }).log();
    }
  }
}

export default SyncUtils;
