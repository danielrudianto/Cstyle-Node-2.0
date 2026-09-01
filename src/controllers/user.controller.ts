import { hash } from "bcrypt";
import { Request, Response } from "express";
import { redisClient } from "../app";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { UserRepository } from "../repositories/user.repository";
import LoggerHelper from "../utils/logger.helper";
import { queue } from "../utils/queue.helper";

/**
 * Lapisan HTTP untuk pengguna.
 *
 * CACHE REDIS DIPERBARUI DARI SINI.
 *
 * auth.interceptor membaca `users:<id>` dari Redis pada SETIAP permintaan
 * yang butuh autentikasi, jadi setiap perubahan pengguna harus ikut menulis
 * ke sana. Kalau tidak, hak akses yang lama tetap berlaku sampai proses
 * dinyalakan ulang.
 *
 * Perhatikan bentuk yang ditulis create() dan updateByID() TIDAK SAMA:
 * create() menyimpan dokumen utuh (termasuk hash password), updateByID()
 * menyimpan objek yang disusun tangan tanpa password. Perbedaan itu sudah ada
 * sebelum refactor ini dan dipertahankan.
 */
export class UserController {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  create = async (req: Request, res: Response) => {
    try {
      if (
        await this.userRepository.isTaken(req.body.username, req.body.code)
      ) {
        return res.status(400).send(ErrorList["USERNAME_ALREADY_EXISTS"]);
      }

      const password = UserController.generateRandomPassword();
      const hashedPassword = await hash(password, 12);

      const result = await this.userRepository.create({
        name: req.body.name,
        code: req.body.code,
        username: req.body.username,
        password: hashedPassword,
        accessLevel: req.body.accessLevel,
        createdBy: req.body.userID,
        createdAt: new Date(),
        isActive: true,
      });

      await redisClient.set(`users:${result._id}`, JSON.stringify(result));
      await queue.add("createUser", { id: result._id });

      /* Password acak dikembalikan sekali saja, untuk diserahkan ke pegawai. */
      return res.status(201).send({ password: password });
    } catch (error) {
      new LoggerHelper({
        message: `Error on creating user ${error}`,
        type: LoggerType.error,
        tag: "User",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetch = async (req: Request, res: Response) => {
    try {
      const result = await this.userRepository.fetch({
        keyword:
          req.query.keyword == undefined || req.query.keyword == null
            ? ""
            : req.query.keyword.toString(),
        page:
          req.query.page == undefined || req.query.page == null
            ? 1
            : parseInt(req.query.page.toString()),
      });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching user ${error}`,
        type: LoggerType.error,
        tag: "User",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchSales = async (req: Request, res: Response) => {
    try {
      const result = await this.userRepository.fetchAutocompleteSales(
        req.query.keyword as string
      );

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching sales user ${error}`,
        tag: "error",
        type: LoggerType.error,
      }).log();

      return res.status(500).send(error);
    }
  };

  /**
   * Pengguna yang tidak ditemukan menghasilkan 500, bukan 404.
   *
   * Penyebabnya fetchByID() pada repository memang MELEMPAR galat, bukan
   * mengembalikan null, sehingga cabang 404 di bawah tidak pernah tercapai.
   * Perilaku ini dipertahankan dari kode lama.
   */
  fetchByID = async (req: Request, res: Response) => {
    try {
      const result = await this.userRepository.fetchByID(req.params.id);
      if (!result) {
        return res.status(404).send(ErrorList["USER_NOT_FOUND"]);
      }

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching user ${error}`,
        type: LoggerType.error,
        tag: "User",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  updateByID = async (req: Request, res: Response) => {
    try {
      const taken = await this.userRepository.isTakenByOther(
        req.body.username,
        req.body.code,
        req.body.id
      );

      if (taken) {
        return res.status(400).send(ErrorList["USERNAME_ALREADY_EXISTS"]);
      }

      const result = await this.userRepository.update({
        _id: req.body.id,
        name: req.body.name,
        username: req.body.username,
        accessLevel: req.body.accessLevel,
        code: req.body.code,
        isActive: true,
      });

      /*
        Objek yang ditulis ke Redis disusun tangan dan tidak memuat password —
        berbeda dengan create(). Dipertahankan supaya isi cache tidak berubah.
      */
      await redisClient.set(
        `users:${result?._id}`,
        JSON.stringify({
          name: req.body.name,
          username: req.body.username,
          accessLevel: req.body.accessLevel,
          code: req.body.code,
          _id: req.body.id,
          isActive: true,
        })
      );

      await queue.add("updateUser", { id: result?._id });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on updating user ${error}`,
        type: LoggerType.error,
        tag: "User",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const user = await this.userRepository.fetchByID(req.body.id);
      if (!user || !user.isActive) {
        return res.status(404).send(ErrorList["USER_NOT_FOUND"]);
      }

      const password = UserController.generateRandomPassword();
      const hashedPassword = await hash(password, 12);

      await this.userRepository.update({
        _id: req.body.id,
        password: hashedPassword,
        name: user.name,
        username: user.username,
        isActive: user.isActive,
        code: user.code,
        accessLevel: user.accessLevel,
      });

      return res.status(201).send({ password: password });
    } catch (error) {
      new LoggerHelper({
        message: `Error on resetting password ${error}`,
        type: LoggerType.error,
        tag: "User",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  deleteByID = async (req: Request, res: Response) => {
    try {
      const result = await this.userRepository.delete(
        req.params.id,
        req.body.userID
      );

      await redisClient.del(`users:${result?._id}`);
      await queue.add("deleteUser", { id: result?._id });

      return res.status(200).send(result);
    } catch (error) {
      new LoggerHelper({
        message: `Error on deleting user ${error}`,
        type: LoggerType.error,
        tag: "User",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  /**
   * Password awal berisi 8 karakter acak.
   *
   * PERINGATAN: Math.random() bukan pembangkit acak kriptografis dan dapat
   * ditebak. Untuk password ini seharusnya memakai crypto.randomInt().
   * Dipertahankan apa adanya di sini karena refactor ini tidak mengubah
   * perilaku — tapi ini perlu diganti.
   */
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
