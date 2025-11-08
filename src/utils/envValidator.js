import { z } from "zod";
import { envSchema } from "../schemas/apiSchemas.js";

/**
 * Validates and returns environment variables
 * Throws error if required variables are missing
 */
export function validateEnv() {
  try {
    const env = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      MONGODB_URI: process.env.MONGODB_URI,
      LOG_LEVEL: process.env.LOG_LEVEL,
    };

    const validated = envSchema.parse(env);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join(".")).join(", ");
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

