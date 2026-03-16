import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    const statusCode = (err as AppError).statusCode || 500;
    const isOperational = (err as AppError).isOperational || false;

    // Log the error
    logger.error({
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

// Catch async errors in route handlers without try/catch boilerplate
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
