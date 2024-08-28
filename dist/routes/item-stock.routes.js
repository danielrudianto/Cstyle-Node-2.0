"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const item_stock_controller_1 = __importDefault(require("../controllers/item-stock.controller"));
const router = (0, express_1.Router)();
router.get("/download", item_stock_controller_1.default.download);
router.get("/:id", item_stock_controller_1.default.fetchByItemID);
router.get("/", item_stock_controller_1.default.fetch);
exports.default = router;
//# sourceMappingURL=item-stock.routes.js.map