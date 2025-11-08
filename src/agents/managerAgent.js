import { Agent, Runner, Session } from "@openai/agents";
import { z } from "zod";
import {
  engagementAgent,
  completionAgent,
  masteryAgent,
  ratingAgent,
  marketAgent
} from "./index.js";
import { retryWithBackoff, isTransientError } from "../utils/retry.js";
import { withTimeout } from "../utils/timeout.js";
import { recordAgentExecution } from "../utils/metrics.js";

export const managerAgent = new Agent({
  name: "Manager Agent",
  model: "gpt-4o-mini",

  instructions: `
You are the Manager Agent coordinating five specialists:

1️⃣ Engagement Analyst — calculates engagementRate  
2️⃣ Completion Analyst — calculates completionRate  
3️⃣ Mastery Analyst — calculates objectiveScore and STR  
4️⃣ Rating Analyst — calculates averageRating  
5️⃣ Market Analyst — calculates strPercent, csr, cod, and insightIndex  

You receive learner response data and metadata (moduleId, cohort, sessionId).  
Your task is to:
- Delegate to each analyst agent to compute their metrics.
- Collect and merge all outputs into a single structured JSON.  
- Do NOT perform validation or computation yourself.  
- Maintain awareness of previous sessions (if provided) to enable trend comparison.  
- Return exactly these fields:

{
  "numberOfLearners": number,
  "engagementRate": number,
  "completionRate": number,
  "averageRating": number,
  "objectiveScore": number,
  "STR": number,
  "strPercent": number,
  "csr": number,
  "cod": number,
  "insightIndex": number
}
`
});

export async function runManager(sessionId, responses, contextInfo = {}) {
  // Create session memory to store context
  const session = new Session(sessionId);

  // Save high-level context (useful for multi-run comparisons)
  session.memory.set("context", {
    moduleId: contextInfo.moduleId || "UnknownModule",
    cohort: contextInfo.cohort || "DefaultCohort",
    previousRuns: contextInfo.previousRuns || []
  });

  // 1️⃣ Delegate parallel execution of specialist agents with error handling, retry, and timeout
  const AGENT_TIMEOUT_MS = 30000; // 30 seconds per agent
  const MAX_RETRIES = 2; // Retry up to 2 times (3 total attempts)

  const runAgentWithRetryAndTimeout = async (agent, agentName) => {
    const agentStartTime = Date.now();
    try {
      const result = await retryWithBackoff(
        () => withTimeout(
          Runner.run(agent, { responses }, { session }),
          AGENT_TIMEOUT_MS,
          `${agentName} timed out after ${AGENT_TIMEOUT_MS}ms`
        ),
        {
          maxAttempts: MAX_RETRIES + 1,
          initialDelay: 1000,
          maxDelay: 5000,
          shouldRetry: isTransientError,
        }
      );
      const duration = Date.now() - agentStartTime;
      recordAgentExecution(agentName, true, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - agentStartTime;
      recordAgentExecution(agentName, false, duration);
      throw error;
    }
  };

  const results = await Promise.allSettled([
    runAgentWithRetryAndTimeout(engagementAgent, "Engagement Agent"),
    runAgentWithRetryAndTimeout(completionAgent, "Completion Agent"),
    runAgentWithRetryAndTimeout(masteryAgent, "Mastery Agent"),
    runAgentWithRetryAndTimeout(ratingAgent, "Rating Agent"),
    runAgentWithRetryAndTimeout(marketAgent, "Market Agent"),
  ]);

  // 2️⃣ Process results and handle partial failures
  const [engagementResult, completionResult, masteryResult, ratingResult, marketResult] = results;
  
  // Helper to extract output or provide defaults
  const getOutput = (result, agentName) => {
    if (result.status === 'fulfilled' && result.value?.output) {
      return result.value.output;
    }
    console.error(`❌ ${agentName} failed:`, result.status === 'rejected' ? result.reason : 'No output');
    return {};
  };

  const engagement = getOutput(engagementResult, 'Engagement Agent');
  const completion = getOutput(completionResult, 'Completion Agent');
  const mastery = getOutput(masteryResult, 'Mastery Agent');
  const rating = getOutput(ratingResult, 'Rating Agent');
  const market = getOutput(marketResult, 'Market Agent');

  // 3️⃣ Compute the number of learners locally
  const numberOfLearners = Array.isArray(responses) ? responses.length : 0;

  // 4️⃣ Merge all results into a unified JSON with defaults
  const combinedMetrics = {
    numberOfLearners,
    engagementRate: engagement.engagementRate ?? 0,
    completionRate: completion.completionRate ?? 0,
    averageRating: rating.averageRating ?? 0,
    objectiveScore: mastery.objectiveScore ?? 0,
    STR: mastery.STR ?? 0,
    strPercent: market.strPercent ?? 0,
    csr: market.csr ?? 0,
    cod: market.cod ?? 0,
    insightIndex: market.insightIndex ?? 0
  };

  // 5️⃣ Optionally store context/memory for trend tracking
  try {
    const context = session.memory.get("context");
    if (context && Array.isArray(context.previousRuns)) {
      context.previousRuns.push(combinedMetrics);
      session.memory.set("context", context);
    }
  } catch (err) {
    console.warn("⚠️ Failed to update session memory:", err.message);
  }

  // 6️⃣ Return the combined output
  return combinedMetrics;
}
