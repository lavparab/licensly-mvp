import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        isProduction
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...rest }) => {
                    const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
                    return `${timestamp} [${level}]: ${message}${extra}`;
                })
            )
    ),
    transports: [
        new winston.transports.Console(),
    ],
});
