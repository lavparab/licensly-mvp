import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'params' | 'query';

/**
 * Middleware factory that validates request data against a Zod schema.
 * Usage: router.post('/items', validate(createItemSchema, 'body'), handler)
 */
export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = schema.parse(req[target]);
            // Replace with parsed (coerced/transformed) data
            (req as any)[target] = parsed;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formatted = error.errors.map((e: { path: (string | number)[]; message: string }) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                return res.status(400).json({
                    error: 'Validation failed',
                    statusCode: 400,
                    details: formatted,
                });
            }
            next(error);
        }
    };
};
