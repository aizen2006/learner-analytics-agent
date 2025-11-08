import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { validateLearnerResponses } from "../tools/validateInput.js";
import { responsesToolParamSchema } from "../schemas/learnerResponse.js";

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
  outputType: z.object({
    strPercent: z.number().min(0).max(100),
    csr: z.number().min(0).max(1),
    cod: z.number().min(0).max(1),
    insightIndex: z.number().min(0).max(1)
  }),
  tools: [
    tool({
      name: "validateLearnerResponses",
      description: "Validate learner responses structure",
      parameters: responsesToolParamSchema,
      execute: async ({ responses }) => validateLearnerResponses(responses)
    })
  ],
  guardrails: {
    input: async (inputs) => {
      if (!inputs.responses) {
        return {
          tripwireTriggered: true,
          outputInfo: { error: "Missing responses for market agent" }
        };
      }
      return { tripwireTriggered: false };
    },
    output: async (output) => {
      if (typeof output?.strPercent !== "number" || output.strPercent < 0 || output.strPercent > 100) {
        return {
          tripwireTriggered: true,
          outputInfo: { error: "Invalid strPercent: must be 0-100" }
        };
      }
      if (typeof output?.csr !== "number" || output.csr < 0 || output.csr > 1) {
        return {
          tripwireTriggered: true,
          outputInfo: { error: "Invalid csr" }
        };
      }
      if (typeof output?.cod !== "number" || output.cod < 0 || output.cod > 1) {
        return {
          tripwireTriggered: true,
          outputInfo: { error: "Invalid cod" }
        };
      }
      if (typeof output?.insightIndex !== "number" || output.insightIndex < 0 || output.insightIndex > 1) {
        return {
          tripwireTriggered: true,
          outputInfo: { error: "Invalid insightIndex" }
        };
      }
      return { tripwireTriggered: false };
    }
  }
});
