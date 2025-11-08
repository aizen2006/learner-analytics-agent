import express from "express";
import dotenv from "dotenv";
import analyzeRouter from "./routes/analyze.js";
import metricsRouter from "./routes/metrics.js";
import csvRouter from "./routes/csv.js";
import { validateEnv } from "./utils/envValidator.js";
import { logger } from "./utils/logger.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { getMetrics } from "./utils/metrics.js";

// Load environment variables
dotenv.config();

// Validate required environment variables
let env;
try {
  env = validateEnv();
  logger.info("Environment variables validated successfully");
} catch (error) {
  logger.error("Environment validation failed", { error: error.message });
  process.exit(1);
}

const app = express();

// Middleware: Request logging with correlation IDs
app.use(requestLogger);

// Middleware: Request size limit (10MB)
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/analyze", analyzeRouter);
app.use("/metrics", metricsRouter);
app.use("/csv", csvRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint
app.get("/metrics/internal", (req, res) => {
  res.json(getMetrics());
});

const PORT = env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { 
    port: PORT, 
    environment: env.NODE_ENV 
  });
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info("HTTP server closed.");
    
    // Close database connections if any
    // TODO: Add database connection cleanup when database is implemented
    
    logger.info("Graceful shutdown complete.");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", { 
    promise: promise.toString(), 
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined
  });
  // Don't exit in production, just log
  if (env.NODE_ENV === "production") {
    // Could send to error tracking service here
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", { error: error.message, stack: error.stack });
  gracefulShutdown("uncaughtException");
});
