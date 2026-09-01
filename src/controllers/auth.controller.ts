import { compare, hash } from "bcrypt";
import { Request, Response } from "express";
import JWT from "jsonwebtoken";
import { ErrorList } from "../constants/error-list.constant";
import { LoggerType } from "../interfaces/logger.interface";
import { UserRepository } from "../repositories/user.repository";
import LoggerHelper from "../utils/logger.helper";

/**
 * Lapisan HTTP untuk autentikasi.
 *
 * Token akses berlaku 8 jam, token penyegar 7 hari, dan keduanya
 * ditandatangani dengan kunci yang BERBEDA — AUTHORIZATION_KEY dan
 * REFRESH_AUTHORIZATION_KEY. Jangan disatukan: token penyegar yang bisa
 * dipakai sebagai token akses akan memperpanjang masa hidup sesi tanpa batas.
 *
 * Tidak ada mekanisme pencabutan token. Menonaktifkan pengguna hanya
 * berpengaruh karena auth.interceptor ikut memeriksa cache Redis pada setiap
 * permintaan — bukan karena tokennya batal.
 */
export class AuthController {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  login = async (req: Request, res: Response) => {
    try {
      const user = await this.userRepository.fetchByUsername(req.body.username);

      /*
        Pengguna tidak ada dan password salah dibalas dengan pesan yang SAMA,
        supaya balasan tidak bisa dipakai menebak username mana yang terdaftar.
      */
      if (user == null || !user.isActive) {
        return res.status(404).send(ErrorList["LOGIN_ERROR"]);
      }

      /*
        DIHAPUS DI SINI: kode lama menjalankan hash(password, 12) lalu
        console.log() hasilnya pada SETIAP login, tanpa memakai hasilnya untuk
        apa pun. Sisa kode debug itu mencetak hash password ke berkas log dan
        memakan sekitar seperempat detik CPU per login secara cuma-cuma.
        Menghapusnya tidak mengubah satu pun balasan API.
      */
      const valid = await compare(req.body.password, user.password as string);
      if (!valid) {
        return res.status(404).send(ErrorList["LOGIN_ERROR"]);
      }

      return res.status(200).send({
        id: user._id,
        name: user.name,
        accessLevel: user.accessLevel,
        token: AuthController.generateAccessToken(user._id!, user.name),
        refreshToken: AuthController.generateRefreshToken(user._id!),
      });
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching user ${error}`,
        type: LoggerType.error,
        tag: "Authentication",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  static generateAccessToken(userID: string, name: string): string {
    return JWT.sign(
      { id: userID, name: name },
      process.env.AUTHORIZATION_KEY!,
      { expiresIn: "8h" }
    );
  }

  static generateRefreshToken(userID: string): string {
    return JWT.sign({ id: userID }, process.env.REFRESH_AUTHORIZATION_KEY!, {
      expiresIn: "7d",
    });
  }

  refreshToken = async (req: Request, res: Response) => {
    if (req.headers["x-token"] == undefined || req.headers["x-token"] == null) {
      return res.status(401).send("Token unrecognized.");
    }

    const componentToken = req.headers["x-token"].toString().split(" ");
    if (componentToken.length !== 2) {
      return res.status(401).send("Token unrecognized.");
    }

    let userID: string;
    try {
      const decoded = JWT.verify(
        componentToken[1],
        process.env.REFRESH_AUTHORIZATION_KEY!
      );
      userID = (decoded as any).id;
    } catch (error) {
      return res.status(401).send("Token already expired.");
    }

    try {
      const user = await this.userRepository.fetchByIDOrNull(userID);
      if (user == null || !user.isActive) {
        return res.status(400).send("User not recognized");
      }

      return res.status(200).send({
        token: AuthController.generateAccessToken(user._id!, user.name),
      });
    } catch (error) {
      new LoggerHelper({
        message: `Error on refreshing token ${error}`,
        type: LoggerType.error,
        tag: "Authentication",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  fetchProfile = async (req: Request, res: Response) => {
    try {
      const user = await this.userRepository.fetchByIDOrNull(req.body.userID);
      if (!user || !user.isActive) {
        return res.status(404).send(ErrorList["USER_NOT_FOUND"]);
      }

      /* Bidang dipilih satu per satu, jadi hash password tidak ikut terkirim. */
      return res.status(200).send({
        id: user._id,
        name: user.name,
        accessLevel: user.accessLevel,
        code: user.code,
        username: user.username,
        isActive: user.isActive,
        createdAt: user.createdAt,
      });
    } catch (error) {
      new LoggerHelper({
        message: `Error on fetching profile ${error}`,
        type: LoggerType.error,
        tag: "Authentication",
      }).log();

      return res.status(500).send(ErrorList["INTERNAL_SERVER_ERROR"]);
    }
  };

  updatePassword = async (req: Request, res: Response) => {
    try {
      const user = await this.userRepository.fetchByIDOrNull(req.body.userID);

      /*
        Kode lama langsung memakai user!.password tanpa memeriksa null, jadi
        pengguna yang tidak ditemukan menghasilkan galat dan berakhir sebagai
        401 "Invalid old password." dari cabang tangkapan di bawah. Bentuk
        balasan itu dipertahankan.
      */
      let valid = false;
      try {
        valid = await compare(req.body.oldPassword, user!.password as string);
      } catch (error) {
        console.error(`[error]: Error on comparing password: ${error}`);
        return res.status(401).send("Invalid old password.");
      }

      if (!valid) {
        return res.status(401).send("Invalid old password.");
      }

      const hashedPassword = await hash(req.body.newPassword, 12);
      await this.userRepository.updatePassword(
        req.body.userID,
        hashedPassword
      );

      /*
        PERHATIAN: yang dikirim balik adalah dokumen pengguna SEBELUM
        perubahan, dan dokumen itu MEMUAT hash password. Ini kebocoran yang
        sudah ada sebelum refactor dan dipertahankan supaya bentuk balasan
        tidak berubah. Perbaikannya: kirim bidang yang dipilih satu per satu,
        seperti fetchProfile() di atas.
      */
      return res.status(201).send(user);
    } catch (error) {
      console.error(`[error]: Error on updating password: ${error}`);
      return res.status(500).send(error);
    }
  };
}

export default AuthController;
