"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const delivery_slip_controller_1 = __importDefault(require("../controllers/delivery-slip.controller"));
const router = (0, express_1.Router)();
router.post("/search/v2", delivery_slip_controller_1.default.fetch);
router.post("/", delivery_slip_controller_1.default.create);
router.get("/unconfirmed", delivery_slip_controller_1.default.fetchUnconfirmed);
router.get("/invoice/:id", delivery_slip_controller_1.default.fetchByIDWInvoice);
router.get("/:id", delivery_slip_controller_1.default.fetchByID);
router.put("/confirm", delivery_slip_controller_1.default.confirm);
exports.default = router;
//# sourceMappingURL=delivery-slip.routes.js.map