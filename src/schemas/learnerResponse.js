import { z } from "zod";

/**
 * Schema for a single learner response item
 */
export const learnerResponseItemSchema = z.object({
  question_id: z.string().optional(),
  answer: z.any().optional(),
  correct: z.boolean().optional(),
  completed: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
  timestamp: z.string().optional(),
});

/**
 * Schema for a learner's complete response set
 */
export const learnerResponseSchema = z.object({
  learner_id: z.string(),
  responses: z.array(learnerResponseItemSchema),
});

/**
 * Schema for the array of learner responses
 */
export const learnerResponsesArraySchema = z.array(learnerResponseSchema).min(1);

/**
 * Schema for tool parameters that accept responses
 */
export const responsesToolParamSchema = z.object({
  responses: learnerResponsesArraySchema,
});

