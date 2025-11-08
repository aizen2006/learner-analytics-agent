import { Agent, tool } from "@openai/agents";
import { validateLearnerResponses } from "../tools/validateInput.js";

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
      if (!inputs.responses) throw new Error("Missing responses field for mastery agent");
    },
    output: (output) => {
      if (typeof output.objectiveScore !== "number" || output.objectiveScore < 0 || output.objectiveScore > 1) {
        throw new Error("Invalid objectiveScore");
      }
      if (typeof output.STR !== "number" || output.STR < 0 || output.STR > 1) {
        throw new Error("Invalid STR");
      }
    }
  }
});

