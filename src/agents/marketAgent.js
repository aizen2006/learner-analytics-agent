import { Agent, tool } from "@openai/agents";
import { validateLearnerResponses } from "../tools/validateInput.js";

export const marketAgent = new Agent({
  name: "Market Insight Analyst Agent",
  instructions: `
You are the Market Insight Analyst.
You receive learner responses (including mastery, completion etc).
Compute these metrics:
- strPercent: percentage (0–100) of learners meeting readiness threshold.
- csr: conversion stopping ratio (0–1).
- cod: client objection demand (0–1).
- insightIndex: a blended health score (0–1).
Return JSON exactly: { "strPercent": number, "csr": number, "cod": number, "insightIndex": number }.
No extra keys.
  `,
  tools: [
    tool({
      name: "validateLearnerResponses",
      description: "Validate learner responses structure",
      parameters: { responses: "array" },
      execute: async ({ responses }) => validateLearnerResponses(responses)
    })
  ],
  guardrails: {
    input: (inputs) => {
      if (!inputs.responses) throw new Error("Missing responses for market agent");
    },
    output: (output) => {
      if (typeof output.strPercent !== "number" || output.strPercent < 0 || output.strPercent > 100) {
        throw new Error("Invalid strPercent: must be 0-100");
      }
      if (typeof output.csr !== "number" || output.csr < 0 || output.csr > 1) {
        throw new Error("Invalid csr");
      }
      if (typeof output.cod !== "number" || output.cod < 0 || output.cod > 1) {
        throw new Error("Invalid cod");
      }
      if (typeof output.insightIndex !== "number" || output.insightIndex < 0 || output.insightIndex > 1) {
        throw new Error("Invalid insightIndex");
      }
    }
  }
});
