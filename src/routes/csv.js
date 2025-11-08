import express from "express";
import { readLearnerResponsesFromCSV, listCSVFiles } from "../utils/csvReader.js";
import { runManager } from "../agents/managerAgent.js";
import { writeMetricsToDB } from "../tools/dbWrite.js";
import { analyzeRequestSchema } from "../schemas/apiSchemas.js";
import { analyzeRateLimiter } from "../middleware/rateLimiter.js";
import { recordRequest, recordError } from "../utils/metrics.js";

const router = express.Router();

// Apply rate limiting
router.use(analyzeRateLimiter);

/**
 * POST /csv/analyze
 * Analyzes learner responses from a CSV file
 * Request body: { csvFilePath: string, moduleId?: string, cohort?: string }
 */
router.post("/analyze", async (req, res) => {
  const startTime = Date.now();
  const logger = req.logger || console;

  try {
    const { csvFilePath, moduleId, cohort } = req.body;

    if (!csvFilePath || typeof csvFilePath !== "string") {
      const duration = Date.now() - startTime;
      recordRequest("/csv/analyze", 400, duration);
      recordError("validation_error", "Missing csvFilePath");

      return res.status(400).json({
        success: false,
        error: "csvFilePath is required and must be a string",
      });
    }

    logger.info("Reading learner responses from CSV", { csvFilePath });

    // Read and parse CSV file
    const learnerResponses = await readLearnerResponsesFromCSV(csvFilePath);

    if (!learnerResponses || learnerResponses.length === 0) {
      const duration = Date.now() - startTime;
      recordRequest("/csv/analyze", 400, duration);
      recordError("validation_error", "CSV file is empty or invalid");

      return res.status(400).json({
        success: false,
        error: "CSV file is empty or contains no valid learner responses",
      });
    }

    // Validate the parsed data matches our schema
    const validationResult = analyzeRequestSchema.safeParse({
      learnerResponses,
      moduleId,
      cohort,
    });

    if (!validationResult.success) {
      const duration = Date.now() - startTime;
      recordRequest("/csv/analyze", 400, duration);
      recordError("validation_error", "Invalid CSV data structure");

      logger.warn("Invalid CSV data structure", {
        errors: validationResult.error.errors,
      });

      return res.status(400).json({
        success: false,
        error: "CSV data does not match expected format",
        details: validationResult.error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }

    // Generate session ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sessionId = `${moduleId || "module"}-${timestamp}`;

    logger.info("Starting analysis session from CSV", {
      sessionId,
      moduleId,
      cohort,
      learnerCount: learnerResponses.length,
    });

    // Run the manager agent system
    const metrics = await runManager(sessionId, learnerResponses, {
      moduleId,
      cohort,
    });

    // Attach context info
    metrics.sessionId = sessionId;
    metrics.moduleId = moduleId || "UnknownModule";
    metrics.cohort = cohort || "DefaultCohort";
    metrics.analyzedAt = new Date().toISOString();
    metrics.source = "csv";
    metrics.csvFilePath = csvFilePath;

    // Save metrics
    await writeMetricsToDB(sessionId, metrics);

    const duration = Date.now() - startTime;
    recordRequest("/csv/analyze", 200, duration);

    logger.info("CSV analysis completed successfully", {
      sessionId,
      duration: `${duration}ms`,
    });

    res.json({
      success: true,
      message: "Analysis completed successfully from CSV",
      sessionId,
      data: metrics,
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    const statusCode = err.statusCode || 500;
    recordRequest("/csv/analyze", statusCode, duration);
    recordError(err.name || "unknown_error", err.message);

    logger.error("Error in /csv/analyze route", {
      error: err.message,
      stack: err.stack,
      duration: `${duration}ms`,
    });

    res.status(statusCode).json({
      success: false,
      error: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
});

/**
 * GET /csv/files
 * Lists available CSV files in the data directory
 */
router.get("/files", async (req, res) => {
  const logger = req.logger || console;

  try {
    const { directory } = req.query;
    const csvFiles = await listCSVFiles(directory);

    logger.info("Listed CSV files", { count: csvFiles.length });

    res.json({
      success: true,
      files: csvFiles,
      count: csvFiles.length,
    });
  } catch (err) {
    logger.error("Error listing CSV files", {
      error: err.message,
      stack: err.stack,
    });

    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
});

export default router;

