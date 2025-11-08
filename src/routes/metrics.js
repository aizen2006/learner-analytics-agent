import express from "express";
import { metricsMemory } from "../tools/dbWrite.js";
import { metricsRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Apply rate limiting to all routes
router.use(metricsRateLimiter);

// Fetch all metrics or by moduleId/sessionId
router.get("/", (req, res) => {
  const { moduleId, sessionId } = req.query;

  if (sessionId && metricsMemory[sessionId]) {
    return res.json(metricsMemory[sessionId]);
  }

  if (moduleId) {
    const filtered = Object.values(metricsMemory).filter(
      (m) => m.moduleId === moduleId
    );
    return res.json(filtered);
  }

  // Return all sessions if no filter
  res.json(metricsMemory);
});

export default router;
