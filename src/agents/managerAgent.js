import { createAgent, Runner, Session } from "@openai/agents";
import {
  engagementAgent,
  completionAgent,
  masteryAgent,
  ratingAgent,
  marketAgent
} from "./index.js";

export const managerAgent = createAgent({
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

  // 1️⃣ Delegate parallel execution of specialist agents
  const [engagement, completion, mastery, rating, market] = await Promise.all([
    Runner.run(engagementAgent, { responses }, { session }),
    Runner.run(completionAgent, { responses }, { session }),
    Runner.run(masteryAgent, { responses }, { session }),
    Runner.run(ratingAgent, { responses }, { session }),
    Runner.run(marketAgent, { responses }, { session })
  ]);

  // 2️⃣ Compute the number of learners locally
  const numberOfLearners = Array.isArray(responses) ? responses.length : 0;

  // 3️⃣ Merge all results into a unified JSON
  const combinedMetrics = {
    numberOfLearners,
    ...engagement.output,
    ...completion.output,
    ...mastery.output,
    ...rating.output,
    ...market.output
  };

  // 4️⃣ Optionally store context/memory for trend tracking
  const context = session.memory.get("context");
  context.previousRuns.push(combinedMetrics);
  session.memory.set("context", context);

  // 5️⃣ Return the combined output
  return combinedMetrics;
}
