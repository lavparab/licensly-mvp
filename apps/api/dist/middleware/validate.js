"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
/**
 * Middleware factory that validates request data against a Zod schema.
 * Usage: router.post('/items', validate(createItemSchema, 'body'), handler)
 */
const validate = (schema, target = 'body') => {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req[target]);
            // Replace with parsed (coerced/transformed) data
            req[target] = parsed;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formatted = error.errors.map((e) => ({
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
exports.validate = validate;
