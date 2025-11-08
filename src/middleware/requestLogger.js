import { v4 as uuidv4 } from "uuid";
import { createLoggerWithCorrelation } from "../utils/logger.js";

/**
 * Middleware to add correlation ID and request logging
 */
export function requestLogger(req, res, next) {
  // Generate correlation ID if not present
  const correlationId = req.headers["x-correlation-id"] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);

  // Create logger with correlation ID
  req.logger = createLoggerWithCorrelation(correlationId);

  // Log request
  req.logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  }, "Incoming request");

  // Log response when finished
  const startTime = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    req.logger.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    }, "Request completed");
  });

  next();
}

