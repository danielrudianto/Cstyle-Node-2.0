"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockRequest = void 0;
const mongoose_1 = require("mongoose");
class StockRequest {
    constructor(from, to, items, note, userID) {
        this.requestFrom = from;
        this.requestTo = to;
        this.items = items;
        this.note = note;
        this.userID = userID;
    }
}
exports.StockRequest = StockRequest;
const StockRequestItemSchema = new mongoose_1.Schema({
    itemID: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "items",
    },
    quantity: {
        type: Number,
        required: true,
    },
});
const StockRequestSchema = new mongoose_1.Schema({
    requestFrom: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        default: null,
        ref: "stores",
    },
    requestTo: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        default: null,
        ref: "stores",
    },
    name: {
        type: String,
        required: true,
        unique: true,
    },
    items: {
        type: [StockRequestItemSchema],
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: new Date(),
    },
    createdBy: {
        type: mongoose_1.Types.ObjectId,
        required: true,
        ref: "users",
    },
    note: {
        type: String,
        required: false,
        default: "",
    },
    isSending: {
        type: Boolean,
        required: true,
        default: false,
    },
    sendBy: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "users",
    },
    sendAt: {
        type: Date,
        required: false,
    },
    isConfirm: {
        type: Boolean,
        required: true,
        default: false,
    },
    isReject: {
        type: Boolean,
        required: true,
        default: false,
    },
    updatedBy: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "users",
        default: null,
    },
    updatedAt: {
        type: Date,
        required: false,
        default: null,
    },
    rejectNote: {
        type: String,
        required: false,
        default: "",
    },
    isDelete: {
        type: Boolean,
        required: true,
        default: false,
    },
    deletedBy: {
        type: mongoose_1.Types.ObjectId,
        required: false,
        ref: "users",
        default: null,
    },
    deletedAt: {
        type: Date,
        required: false,
        default: null,
    },
});
exports.default = StockRequestSchema;
//# sourceMappingURL=ins.stock-request.model.js.map