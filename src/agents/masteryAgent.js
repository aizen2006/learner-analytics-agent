import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { validateLearnerResponses } from "../tools/validateInput.js";
import { responsesToolParamSchema } from "../schemas/learnerResponse.js";

export const masteryAgent = new Agent({
  name: "Mastery Analyst Agent",
  instructions: `
You are the Mastery Analyst. 
You get learner responses with quiz/answers, correctness flags etc.
Compute two metrics:
- objectiveScore: average correctness (0–1).
- STR: a composite strength-to-completion score (0–1) that blends objectiveScore and whether learner completed.
Return JSON: { "objectiveScore": number, "STR": number }.
No extra fields.
  `,
  outputType: z.object({
    objectiveScore: z.number().min(0).max(1),
    STR: z.number().min(0).max(1)
  }),
  tools: [
    tool({
      name: "validateLearnerResponses",
      description: "Validate input structure",
      parameters: responsesToolParamSchema,
      execute: async ({ responses }) => validateLearnerResponses(responses)
    })
  ],
  guardrails: {
    input: async (inputs) => {
      if (!inputs.responses) {
        return {
          tripwireTriggered: true,
          outputInfo: { error: "Missing responses field for mastery agent" }
        };
      }
      return { tripwireTriggered: false };
    },
    output: async (output) => {
      if (typeof output?.objectiveScore !== "number" || output.objectiveScore < 0 || output.objectiveScore > 1) {
        return {
          tripwireTriggered: true,
          outputInfo: { error: "Invalid objectiveScore" }
        };
      }
      if (typeof output?.STR !== "number" || output.STR < 0 || output.STR > 1) {
        return {
          tripwireTriggered: true,
          outputInfo: { error: "Invalid STR" }
        };
      }
      return { tripwireTriggered: false };
    }
  }
});

