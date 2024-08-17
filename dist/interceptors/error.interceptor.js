"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
class ErrorInterceptor {
}
ErrorInterceptor.intercept = (req, res, next) => {
    const validation_result = (0, express_validator_1.validationResult)(req);
    if (!validation_result.isEmpty()) {
        return res.status(400).send(validation_result.array()[0].msg);
    }
    else {
        next();
    }
};
ErrorInterceptor.authIntercept = (req, res, next) => {
    const validation_result = (0, express_validator_1.validationResult)(req);
    if (!validation_result.isEmpty()) {
        return res.status(401).send(validation_result.array()[0].msg);
    }
    else {
        next();
    }
};
exports.default = ErrorInterceptor;
//# sourceMappingURL=error.interceptor.js.map