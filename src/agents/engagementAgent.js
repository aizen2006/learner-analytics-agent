import { Agent, tool } from "@openai/agents";
import { validateLearnerResponses } from "../tools/validateInput.js";
import { calculateCounts } from "../tools/calcStats.js";

export const engagementAgent = new Agent({
  name: "Engagement Analyst Agent",
  instructions: `
You are the Engagement Analyst. 
Your job: Given a list of learner responses to a learning module, you must compute the "engagementRate" metric (0 to 1).
Consider: how many content cards/questions each learner touched, responses count, time stamps (if available) and whether they skipped.
Return exactly JSON with one key: "engagementRate": number.
Do not include extra keys.
  `,
  tools: [
    tool({
      name: "validateLearnerResponses",
      description: "Validate the incoming learner responses array structure",
      parameters: { responses: "array" },
      execute: async ({ responses }) => validateLearnerResponses(responses)
    }),
    tool({
      name: "calculateCounts",
      description: "Get basic counts like numberOfLearners from the responses",
      parameters: { responses: "array" },
      execute: async ({ responses }) => calculateCounts(responses)
    })
  ],
  guardrails: {
    input: (inputs) => {
      if (!inputs.responses || !Array.isArray(inputs.responses)) {
        throw new Error("Invalid input: responses must be an array");
      }
    },
    output: (output) => {
      if (typeof output.engagementRate !== "number" ||
          output.engagementRate < 0 || output.engagementRate > 1) {
        throw new Error("Invalid output: engagementRate must be number between 0 and 1");
      }
    }
  }
});
