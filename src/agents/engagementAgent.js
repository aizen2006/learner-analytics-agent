import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { validateLearnerResponses } from "../tools/validateInput.js";
import { calculateCounts } from "../tools/calcStats.js";
import { responsesToolParamSchema } from "../schemas/learnerResponse.js";

export const engagementAgent = new Agent({
  name: "Engagement Analyst Agent",
  instructions: `
You are the Engagement Analyst. 
Your job: Given a list of learner responses to a learning module, you must compute the "engagementRate" metric (0 to 1).
Consider: how many content cards/questions each learner touched, responses count, time stamps (if available) and whether they skipped.
Return exactly JSON with one key: "engagementRate": number.
Do not include extra keys.
  `,
  outputType: z.object({
    engagementRate: z.number().min(0).max(1)
  }),
  tools: [
    tool({
      name: "validateLearnerResponses",
      description: "Validate the incoming learner responses array structure",
      parameters: responsesToolParamSchema,
      execute: async ({ responses }) => validateLearnerResponses(responses)
    }),
    tool({
      name: "calculateCounts",
      description: "Get basic counts like numberOfLearners from the responses",
      parameters: responsesToolParamSchema,
      execute: async ({ responses }) => calculateCounts(responses)
    })
  ],
  guardrails: {
    input: async (inputs) => {
      if (!inputs.responses || !Array.isArray(inputs.responses)) {
        return {
          tripwireTriggered: true,
          outputInfo: { error: "Invalid input: responses must be an array" }
        };
      }
      return { tripwireTriggered: false };
    },
    output: async (output) => {
      if (typeof output?.engagementRate !== "number" ||
          output.engagementRate < 0 || output.engagementRate > 1) {
        return {
          tripwireTriggered: true,
          outputInfo: { error: "Invalid output: engagementRate must be number between 0 and 1" }
        };
      }
      return { tripwireTriggered: false };
    }
  }
});
