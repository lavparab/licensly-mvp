"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || false;
    // Log the error
    logger_1.logger.error({
        message: err.message,
        statusCode,
        path: req.path,
        method: req.method,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });
    res.status(statusCode).json({
        error: isOperational ? err.message : 'Internal server error',
        statusCode,
        ...(process.env.NODE_ENV !== 'production' && {
            details: err.stack,
        }),
    });
};
exports.errorHandler = errorHandler;
// Catch async errors in route handlers without try/catch boilerplate
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
