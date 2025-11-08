import { Agent, tool } from "@openai/agents";
import { validateLearnerResponses } from "../tools/validateInput.js";

export const completionAgent = new Agent({
  name: "Completion Analyst Agent",
  instructions: `
You are the Completion Analyst. 
You receive a list of learner responses with a field “completed” (true/false).
Compute "completionRate" = (# learners with completed=true) ÷ (total # learners).
Return exactly JSON object: { "completionRate": number } with value 0–1.
No other keys.
  `,
  tools: [
    tool({
      name: "validateLearnerResponses",
      description: "Validate input structure",
      parameters: { responses: "array" },
      execute: async ({ responses }) => validateLearnerResponses(responses)
    })
  ],
  guardrails: {
    input: (inputs) => {
      if (!inputs.responses) throw new Error("Missing responses field");
    },
    output: (output) => {
      if (typeof output.completionRate !== "number" ||
          output.completionRate < 0 || output.completionRate > 1) {
        throw new Error("Invalid output: completionRate must be between 0 and 1");
      }
    }
  }
});
