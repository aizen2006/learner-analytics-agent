import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { validateLearnerResponses } from "../tools/validateInput.js";
import { responsesToolParamSchema } from "../schemas/learnerResponse.js";

export const ratingAgent = new Agent({
  name: "Rating Analyst Agent",
  instructions: `
You are the Rating Analyst.
You receive learner responses that include rating questions (1-5).
Compute "averageRating" (float) as the mean of rating values.
Return JSON: { "averageRating": number }.
No other keys.
  `,
  outputType: z.object({
    averageRating: z.number().min(1).max(5)
  }),
  tools: [
    tool({
      name: "validateLearnerResponses",
      description: "Validate learner responses array structure",
      parameters: responsesToolParamSchema,
      execute: async ({ responses }) => validateLearnerResponses(responses)
    })
  ],
  guardrails: {
    input: async (inputs) => {
      if (!inputs.responses) {
        return {
          tripwireTriggered: true,
          outputInfo: { error: "Missing responses for rating agent" }
        };
      }
      return { tripwireTriggered: false };
    },
    output: async (output) => {
      if (typeof output?.averageRating !== "number" || output.averageRating < 1 || output.averageRating > 5) {
        return {
          tripwireTriggered: true,
          outputInfo: { error: "Invalid averageRating: must be between 1 and 5" }
        };
      }
      return { tripwireTriggered: false };
    }
  }
});
