"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_interceptor_1 = __importDefault(require("../interceptors/auth.interceptor"));
const express_validator_1 = require("express-validator");
const error_list_1 = require("../data/error-list");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const item_controller_1 = __importDefault(require("../controllers/item.controller"));
const error_interceptor_1 = __importDefault(require("../interceptors/error.interceptor"));
const access_interceptor_1 = __importDefault(require("../interceptors/access.interceptor"));
const router = (0, express_1.Router)();
const uploadOptions = multer_1.default.diskStorage({
    destination: "upload",
    filename: (req, file, cb) => {
        if (fs_1.default.existsSync(path_1.default.join("upload", file.originalname))) {
            cb(new Error("File already exists"), file.originalname);
        }
        else {
            cb(null, file.originalname);
        }
    },
});
const upload = (0, multer_1.default)({
    storage: uploadOptions,
});
router.post("/price", (0, express_validator_1.body)("type").exists().withMessage(error_list_1.ErrorList["ITEM_TYPE_REQUIRED"]), (0, express_validator_1.body)("brand").exists().withMessage(error_list_1.ErrorList["ITEM_BRAND_REQUIRED"]), error_interceptor_1.default.intercept, item_controller_1.default.fetchPrice);
router.post("/selector/v2", item_controller_1.default.fetchByBranchV2);
router.post("/v2", access_interceptor_1.default.administratorRequired, upload.array("images", 8), (req, res, next) => {
    req.body.images =
        req.files == undefined
            ? []
            : req.files.map((file) => `upload/${file.originalname}`);
    next();
}, auth_interceptor_1.default.intercept, item_controller_1.default.createV2);
router.put("/like", access_interceptor_1.default.administratorRequired, (0, express_validator_1.body)("itemID").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), (0, express_validator_1.body)("isFavorite").isBoolean().withMessage(error_list_1.ErrorList["IS_FAVORITE_INVALID"]), error_interceptor_1.default.intercept, item_controller_1.default.updateFavoriteStatus);
router.put("/price", access_interceptor_1.default.administratorRequired, (0, express_validator_1.body)("items").isArray().withMessage(error_list_1.ErrorList["ITEMS_INVALID"]), (0, express_validator_1.body)("items.*.id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), (0, express_validator_1.body)("items.*.price").isNumeric().withMessage(error_list_1.ErrorList["PRICE_INVALID"]), (0, express_validator_1.body)("items.*.price")
    .isFloat({ min: 0 })
    .withMessage(error_list_1.ErrorList["PRICE_NEGATIVE"]), error_interceptor_1.default.intercept, item_controller_1.default.updatePrice);
router.put("/v2", access_interceptor_1.default.administratorRequired, (req, res, next) => {
    upload.array("images", 8)(req, res, (err) => {
        if (err) {
            return res.status(400).send(err.message);
        }
        else {
            req.body.images =
                req.files == undefined || req.files == null
                    ? []
                    : req.files.map((file) => `upload/${file.originalname}`);
            next();
        }
    });
}, item_controller_1.default.updateV2);
router.get("/v2", item_controller_1.default.fetchV2);
router.get("/download", item_controller_1.default.download);
router.get("/:id", access_interceptor_1.default.administratorRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, item_controller_1.default.fetchByID);
router.delete("/image/:id/:name", access_interceptor_1.default.administratorRequired, item_controller_1.default.deleteImage);
router.delete("/:id", access_interceptor_1.default.administratorRequired, (0, express_validator_1.param)("id").isMongoId().withMessage(error_list_1.ErrorList["ID_INVALID"]), error_interceptor_1.default.intercept, item_controller_1.default.deleteByID);
exports.default = router;
//# sourceMappingURL=item.routes.js.map