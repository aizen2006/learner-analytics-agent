import { Agent, tool } from "@openai/agents";
import { validateLearnerResponses } from "../tools/validateInput.js";

export const ratingAgent = new Agent({
  name: "Rating Analyst Agent",
  instructions: `
You are the Rating Analyst.
You receive learner responses that include rating questions (1-5).
Compute "averageRating" (float) as the mean of rating values.
Return JSON: { "averageRating": number }.
No other keys.
  `,
  tools: [
    tool({
      name: "validateLearnerResponses",
      description: "Validate learner responses array structure",
      parameters: { responses: "array" },
      execute: async ({ responses }) => validateLearnerResponses(responses)
    })
  ],
  guardrails: {
    input: (inputs) => {
      if (!inputs.responses) throw new Error("Missing responses for rating agent");
    },
    output: (output) => {
      if (typeof output.averageRating !== "number" || output.averageRating < 1 || output.averageRating > 5) {
        throw new Error("Invalid averageRating: must be between 1 and 5");
      }
    }
  }
});
