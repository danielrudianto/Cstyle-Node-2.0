import { NextFunction, Router } from "express";
import AuthInterceptor from "../interceptors/auth.interceptor";
import { body, param } from "express-validator";
import { ErrorList } from "../data/error-list";
import multer from "multer";
import path from "path";
import fs from "fs";
import ItemController from "../controllers/item.controller";
import ErrorInterceptor from "../interceptors/error.interceptor";
import LoggerHelper from "../utils/logger.utils";
import { LoggerType } from "../interfaces/logger.interface";

const router = Router();

const uploadOptions = multer.diskStorage({
  destination: "upload",
  filename: (req, file, cb) => {
    if (fs.existsSync(path.join("upload", file.originalname))) {
      cb(new Error("File already exists"), file.originalname);
    } else {
      cb(null, file.originalname);
    }
  },
});

const upload = multer({
  storage: uploadOptions,
});

router.post(
  "/price",
  body("type").exists().withMessage(ErrorList["ITEM_TYPE_REQUIRED"]),
  body("brand").exists().withMessage(ErrorList["ITEM_BRAND_REQUIRED"]),
  ErrorInterceptor.intercept,
  ItemController.fetchPrice
);
router.post("/selector/v2", ItemController.fetchByBranchV2);
router.post(
  "/v2",
  upload.array("images", 8),
  (req, res, next) => {
    // Get the file names
    req.body.images =
      req.files == undefined
        ? []
        : (req.files as any[]).map((file) => `upload/${file.originalname}`);
    next();
  },
  AuthInterceptor.intercept,
  ItemController.createV2
);

router.put(
  "/like",
  body("itemID").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  body("isFavorite").isBoolean().withMessage(ErrorList["IS_FAVORITE_INVALID"]),
  ErrorInterceptor.intercept,
  ItemController.updateFavoriteStatus
);
router.put(
  "/v2",
  (req, res, next) => {
    upload.array("images", 8)(req, res, (err) => {
      if (err) {
        return res.status(400).send(err.message);
      } else {
        req.body.images =
          req.files == undefined || req.files == null
            ? []
            : (req.files as any[]).map((file) => `upload/${file.originalname}`);
        next();
      }
    });
  },
  ItemController.updateV2
);

router.get("/v2", ItemController.fetchV2);
router.get(
  "/:id",
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  ItemController.fetchByID
);
router.delete("/image/:id/:name", ItemController.deleteImage);
router.delete(
  "/:id",
  AuthInterceptor.administratorInterceptor,
  param("id").isMongoId().withMessage(ErrorList["ID_INVALID"]),
  ErrorInterceptor.intercept,
  ItemController.deleteByID
);

export default router;
