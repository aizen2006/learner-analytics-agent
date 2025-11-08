import winston from "winston";

const logLevel = process.env.LOG_LEVEL || "info";

/**
 * Create a Winston logger instance with structured logging
 */
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "learner-analytics-agent" },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
  ],
});

// In production, you might want to add file transports
if (process.env.NODE_ENV === "production") {
  logger.add(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    })
  );
  logger.add(
    new winston.transports.File({
      filename: "logs/combined.log",
    })
  );
}

/**
 * Create a child logger with correlation ID
 */
export function createLoggerWithCorrelation(correlationId) {
  return logger.child({ correlationId });
}

