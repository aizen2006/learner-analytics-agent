import express from "express";
import { runManager } from "../agents/managerAgent.js";
import { writeMetricsToDB } from "../tools/dbWrite.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { learnerResponses, moduleId, cohort } = req.body;

  try {
    // 1️⃣ Generate a unique session ID for this analysis
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sessionId = `${moduleId || "module"}-${timestamp}`;

    console.log(`🧠 Starting analysis session: ${sessionId}`);

    // 2️⃣ Run the manager agent system
    const metrics = await runManager(sessionId, learnerResponses);

    // 3️⃣ Attach context info
    metrics.sessionId = sessionId;
    metrics.moduleId = moduleId || "UnknownModule";
    metrics.cohort = cohort || "DefaultCohort";
    metrics.analyzedAt = new Date().toISOString();

    // 4️⃣ Save metrics (stubbed write; replace with DB logic)
    await writeMetricsToDB(sessionId, metrics);

    // 5️⃣ Return final structured analytics
    res.json({
      success: true,
      message: "Analysis completed successfully",
      sessionId,
      data: metrics
    });
  } catch (err) {
    console.error("❌ Error in /analyze route:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;


