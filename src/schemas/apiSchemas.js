import { z } from "zod";
import { learnerResponsesArraySchema } from "./learnerResponse.js";

/**
 * Schema for the analyze endpoint request body
 */
export const analyzeRequestSchema = z.object({
  learnerResponses: learnerResponsesArraySchema,
  moduleId: z.string().min(1).optional(),
  cohort: z.string().min(1).optional(),
});

/**
 * Schema for environment variables
 */
export const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  PORT: z.string().regex(/^\d+$/).transform(Number).optional().default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
  DATABASE_URL: z.string().url().optional(),
  MONGODB_URI: z.string().url().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).optional().default("info"),
});

