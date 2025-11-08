import express from "express";
import { runManager } from "../agents/managerAgent.js";
import { writeMetricsToDB } from "../tools/dbWrite.js";
import { analyzeRequestSchema } from "../schemas/apiSchemas.js";
import { analyzeRateLimiter } from "../middleware/rateLimiter.js";
import { recordRequest, recordError } from "../utils/metrics.js";

const router = express.Router();

// Apply rate limiting to all routes
router.use(analyzeRateLimiter);

router.post("/", async (req, res) => {
  const startTime = Date.now();
  const logger = req.logger || console;
  
  try {
    // 1️⃣ Validate request body
    const validationResult = analyzeRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const duration = Date.now() - startTime;
      recordRequest("/analyze", 400, duration);
      recordError("validation_error", "Invalid request body");
      
      logger.warn("Invalid request body", { 
        errors: validationResult.error.errors 
      });
      
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
        details: validationResult.error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message
        }))
      });
    }

    const { learnerResponses, moduleId, cohort } = validationResult.data;

    // 2️⃣ Generate a unique session ID for this analysis
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sessionId = `${moduleId || "module"}-${timestamp}`;

    logger.info("Starting analysis session", { sessionId, moduleId, cohort });

    // 3️⃣ Run the manager agent system
    const metrics = await runManager(sessionId, learnerResponses, {
      moduleId,
      cohort
    });

    // 4️⃣ Attach context info
    metrics.sessionId = sessionId;
    metrics.moduleId = moduleId || "UnknownModule";
    metrics.cohort = cohort || "DefaultCohort";
    metrics.analyzedAt = new Date().toISOString();

    // 5️⃣ Save metrics (stubbed write; replace with DB logic)
    await writeMetricsToDB(sessionId, metrics);

    const duration = Date.now() - startTime;
    recordRequest("/analyze", 200, duration);
    
    logger.info("Analysis completed successfully", { 
      sessionId, 
      duration: `${duration}ms` 
    });

    // 6️⃣ Return final structured analytics
    res.json({
      success: true,
      message: "Analysis completed successfully",
      sessionId,
      data: metrics
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    const statusCode = err.statusCode || 500;
    recordRequest("/analyze", statusCode, duration);
    recordError(err.name || "unknown_error", err.message);
    
    logger.error("Error in /analyze route", { 
      error: err.message, 
      stack: err.stack,
      duration: `${duration}ms`
    });
    
    res.status(statusCode).json({
      success: false,
      error: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
  }
});

export default router;


