"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_lock_1 = __importDefault(require("async-lock"));
const lock = new async_lock_1.default({
    maxExecutionTime: 2000,
});
exports.default = lock;
//# sourceMappingURL=lock.utils.js.map