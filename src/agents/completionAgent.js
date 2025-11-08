import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { validateLearnerResponses } from "../tools/validateInput.js";
import { responsesToolParamSchema } from "../schemas/learnerResponse.js";

export const completionAgent = new Agent({
  name: "Completion Analyst Agent",
  instructions: `
You are the Completion Analyst. 
You receive a list of learner responses with a field "completed" (true/false).
Compute "completionRate" = (# learners with completed=true) ÷ (total # learners).
Return exactly JSON object: { "completionRate": number } with value 0–1.
No other keys.
  `,
  outputType: z.object({
    completionRate: z.number().min(0).max(1)
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
          outputInfo: { error: "Missing responses field" }
        };
      }
      return { tripwireTriggered: false };
    },
    output: async (output) => {
      if (typeof output?.completionRate !== "number" ||
          output.completionRate < 0 || output.completionRate > 1) {
        return {
          tripwireTriggered: true,
          outputInfo: { error: "Invalid output: completionRate must be between 0 and 1" }
        };
      }
      return { tripwireTriggered: false };
    }
  }
});
