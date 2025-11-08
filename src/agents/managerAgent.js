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
import { logger } from "../utils/logger.js";

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

/**
 * Runs the manager agent system to analyze learner responses
 * @param {string} sessionId - Unique session identifier
 * @param {Array} responses - Array of learner responses
 * @param {Object} contextInfo - Context information (moduleId, cohort, etc.)
 * @returns {Promise<Object>} - Combined metrics from all agents
 */
export async function runManager(sessionId, responses, contextInfo = {}) {
  const session = new Session(sessionId);

  session.memory.set("context", {
    moduleId: contextInfo.moduleId || "UnknownModule",
    cohort: contextInfo.cohort || "DefaultCohort",
    previousRuns: contextInfo.previousRuns || []
  });

  // Configuration for agent execution
  const AGENT_TIMEOUT_MS = 30000;
  const MAX_RETRIES = 2;

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

  // Process results and handle partial failures
  const [engagementResult, completionResult, masteryResult, ratingResult, marketResult] = results;
  
  const getOutput = (result, agentName) => {
    if (result.status === 'fulfilled' && result.value?.output) {
      return result.value.output;
    }
    logger.error(`${agentName} failed`, { 
      reason: result.status === 'rejected' ? result.reason?.message : 'No output' 
    });
    return {};
  };

  const engagement = getOutput(engagementResult, 'Engagement Agent');
  const completion = getOutput(completionResult, 'Completion Agent');
  const mastery = getOutput(masteryResult, 'Mastery Agent');
  const rating = getOutput(ratingResult, 'Rating Agent');
  const market = getOutput(marketResult, 'Market Agent');

  const numberOfLearners = Array.isArray(responses) ? responses.length : 0;

  // Merge all results into unified metrics with defaults
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

  // Store context for trend tracking
  try {
    const context = session.memory.get("context");
    if (context && Array.isArray(context.previousRuns)) {
      context.previousRuns.push(combinedMetrics);
      session.memory.set("context", context);
    }
  } catch (err) {
    logger.warn("Failed to update session memory", { error: err.message });
  }

  return combinedMetrics;
}
