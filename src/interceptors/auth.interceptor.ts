import { NextFunction, Request, Response } from "express";
import * as JWT from "jsonwebtoken";
import { redisClient } from "../app";
import { StoreRepository } from "../repositories/store.repository";
import { UserRepository } from "../repositories/user.repository";
import { conn } from "../utils/database.helper";

const storeRepository = new StoreRepository(conn);
const userRepository = new UserRepository(conn);

/**
 * Pemeriksa identitas pemanggil.
 *
 * ADA DUA CARA MASUK KE SISTEM INI, DAN KEDUANYA DIPAKAI:
 *
 *   1. Token JWT di header "Authorization" — aplikasi kantor (Angular).
 *   2. Kode toko di header "store" — perangkat kasir (Flutter), yang bekerja
 *      luring dan tidak punya token.
 *
 * intercept() hanya menerima cara pertama. anyIntercept() menerima keduanya.
 *
 * APA YANG DITITIPKAN KE req.body:
 *
 *   userID     — dari token, atau dari kode pegawai pada jalur kasir
 *   storeID    — HANYA pada jalur kode toko
 *   employeeID — hanya kalau header "employee-code" dikirim
 *
 * Perhatikan `storeID` TIDAK diisi pada jalur token. Controller yang
 * membacanya akan menerima nilai apa adanya dari badan permintaan, sehingga
 * pemanggil bebas menentukan toko mana yang ingin ia lihat. Itu celah kontrol
 * akses yang sudah ada; memperbaikinya berarti menetapkan storeID di sini,
 * bukan menerimanya dari klien.
 */
class AuthInterceptor {
  /**
   * Hanya menerima token JWT.
   *
   * Selain memeriksa tanda tangan token, statusnya juga dicocokkan ke cache
   * Redis — itulah yang membuat penonaktifan pengguna langsung berlaku tanpa
   * perlu mencabut tokennya.
   */
  static intercept = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const header = req.headers["authorization"];
    if (header == undefined || header == null) {
      return res.status(401).send("Token unrecognized.");
    }

    const componentToken = header.toString().split(" ");
    if (componentToken.length !== 2) {
      return res.status(401).send("Token unrecognized.");
    }

    let userID: string;
    try {
      const decoded = JWT.verify(
        componentToken[1],
        process.env.AUTHORIZATION_KEY!
      );
      userID = (decoded as any).id;
    } catch (error) {
      console.error(`[error]: Error on verifying token: ${error}`);
      return res.status(401).send("Token already expired.");
    }

    try {
      /*
        Kode lama tidak memasang penangkap galat pada pembacaan Redis ini.
        Kalau Redis sedang putus, node-redis MENGANTRE perintahnya alih-alih
        menolak, sehingga promise-nya tidak pernah selesai, next() tidak
        pernah dipanggil, dan SETIAP permintaan terautentikasi menggantung
        tanpa jejak. Sekarang kegagalannya dibalas 500.
      */
      const user = await redisClient.get(`users:${userID}`);

      if (!user) {
        return res.status(401).send("Token unrecognized.");
      }

      if (JSON.parse(user).isActive == false) {
        return res.status(401).send("User is inactive.");
      }

      req.body.userID = userID;
      return next();
    } catch (error) {
      console.error(`[error]: Error on reading user cache: ${error}`);
      return res.status(500).send("Internal server error");
    }
  };

  /**
   * Menerima token JWT ATAU kode toko.
   *
   * PERHATIAN: jalur token di sini TIDAK memeriksa cache Redis, berbeda dari
   * intercept(). Jadi pengguna yang sudah dinonaktifkan masih bisa memakai
   * token lamanya sampai token itu kedaluwarsa — sampai 8 jam.
   */
  static anyIntercept = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const header = req.headers["authorization"];

    if (header != undefined && header != null) {
      const componentToken = header.toString().split(" ");
      if (componentToken.length !== 2) {
        return res.status(401).send("Token unrecognized.");
      }

      try {
        const decoded = JWT.verify(
          componentToken[1],
          process.env.AUTHORIZATION_KEY!
        );

        req.body.userID = (decoded as any).id;
        return next();
      } catch (error) {
        return res.status(401).send("Token already expired.");
      }
    }

    /*
      Jalur perangkat kasir. Kode toko disimpan di SharedPreference tanpa tanda
      hubung (32 karakter), sedangkan yang tersimpan di database berbentuk
      UUID — jadi disusun ulang dulu.

      Perlu disadari: kode toko ini adalah kredensial permanen yang dikirim
      apa adanya di header, tidak bisa dirotasi, dan sama untuk seluruh
      perangkat di satu toko.
    */
    const storeUID = req.headers["store"];
    if (storeUID == undefined || storeUID == null || storeUID == "") {
      return res.status(401).send("Token unrecognized.");
    }

    const raw = storeUID.toString();
    const formattedUID = [
      raw.substring(0, 8),
      raw.substring(8, 12),
      raw.substring(12, 16),
      raw.substring(16, 20),
      raw.substring(20, 32),
    ].join("-");

    const employeeCode = req.headers["employee-code"];

    try {
      const store = await storeRepository.fetchActiveByCode(formattedUID);
      if (!store) {
        return res.status(401).send("Token unrecognized.");
      }

      req.body.storeID = store._id;

      /* Kode pegawai opsional: sebagian layar kasir tidak membutuhkannya. */
      if (employeeCode == undefined || employeeCode == null) {
        return next();
      }

      const user = await userRepository.fetchActiveByCode(
        employeeCode.toString()
      );

      if (!user) {
        return res.status(401).send("Token unrecognized.");
      }

      req.body.employeeID = user._id;
      return next();
    } catch (error) {
      console.error(`[error]: Error on verifying token: ${error}`);
      return res.status(401).send("Token unrecognized.");
    }
  };
}

export default AuthInterceptor;
