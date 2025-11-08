import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads and parses a CSV file containing learner responses
 * @param {string} filePath - Path to the CSV file (relative to project root or absolute)
 * @returns {Promise<Array>} - Array of learner response objects
 */
export async function readLearnerResponsesFromCSV(filePath) {
  try {
    // Resolve file path
    const resolvedPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.resolve(process.cwd(), filePath);

    logger.info("Reading CSV file", { filePath: resolvedPath });

    // Read file content
    const fileContent = await fs.readFile(resolvedPath, "utf-8");

    // Parse CSV
    const records = parse(fileContent, {
      columns: true, // Use first line as column names
      skip_empty_lines: true,
      trim: true,
    });

    logger.info("CSV file parsed successfully", { 
      recordCount: records.length 
    });

    // Transform CSV records to learner response format
    const learnerResponses = transformCSVToLearnerResponses(records);

    return learnerResponses;
  } catch (error) {
    logger.error("Error reading CSV file", { 
      filePath, 
      error: error.message 
    });
    throw new Error(`Failed to read CSV file: ${error.message}`);
  }
}

/**
 * Transforms CSV records to the expected learner response format
 * Expected CSV columns:
 * - learner_id: Unique identifier for the learner
 * - question_id: (optional) Identifier for the question
 * - answer: (optional) The answer provided
 * - correct: (optional) Boolean indicating if answer is correct
 * - completed: (optional) Boolean indicating if learner completed
 * - rating: (optional) Rating value (1-5)
 * - timestamp: (optional) ISO timestamp string
 * 
 * @param {Array} records - Parsed CSV records
 * @returns {Array} - Transformed learner responses
 */
function transformCSVToLearnerResponses(records) {
  // Group records by learner_id
  const learnerMap = new Map();

  for (const record of records) {
    const learnerId = record.learner_id || record.learnerId || record["Learner ID"];
    
    if (!learnerId) {
      logger.warn("Skipping record with missing learner_id", { record });
      continue;
    }

    if (!learnerMap.has(learnerId)) {
      learnerMap.set(learnerId, {
        learner_id: learnerId,
        responses: [],
      });
    }

    const learner = learnerMap.get(learnerId);
    
    // Build response object from CSV record
    const response = {};
    
    // Map common CSV column variations
    if (record.question_id || record.questionId || record["Question ID"]) {
      response.question_id = record.question_id || record.questionId || record["Question ID"];
    }
    
    if (record.answer || record.Answer) {
      response.answer = record.answer || record.Answer;
    }
    
    // Handle boolean fields
    if (record.correct !== undefined || record.Correct !== undefined) {
      const correctValue = record.correct || record.Correct;
      response.correct = parseBoolean(correctValue);
    }
    
    if (record.completed !== undefined || record.Completed !== undefined) {
      const completedValue = record.completed || record.Completed;
      response.completed = parseBoolean(completedValue);
    }
    
    // Handle numeric fields
    if (record.rating !== undefined || record.Rating !== undefined) {
      const rating = record.rating || record.Rating;
      response.rating = parseFloat(rating);
      if (isNaN(response.rating)) {
        delete response.rating;
      }
    }
    
    if (record.timestamp || record.Timestamp || record.created_at || record.createdAt) {
      response.timestamp = record.timestamp || record.Timestamp || record.created_at || record.createdAt;
    }

    learner.responses.push(response);
  }

  const result = Array.from(learnerMap.values());
  
  logger.info("Transformed CSV records to learner responses", { 
    learnerCount: result.length 
  });

  return result;
}

/**
 * Parses various boolean string representations
 * @param {any} value - Value to parse
 * @returns {boolean} - Parsed boolean value
 */
function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return lower === "true" || lower === "1" || lower === "yes" || lower === "y";
  }
  if (typeof value === "number") return value !== 0;
  return false;
}

/**
 * Lists available CSV files in a directory
 * @param {string} directory - Directory path (default: ./data)
 * @returns {Promise<Array>} - Array of CSV file names
 */
export async function listCSVFiles(directory = "./data") {
  try {
    const resolvedPath = path.isAbsolute(directory)
      ? directory
      : path.resolve(process.cwd(), directory);

    // Create directory if it doesn't exist
    try {
      await fs.access(resolvedPath);
    } catch {
      await fs.mkdir(resolvedPath, { recursive: true });
      logger.info("Created data directory", { path: resolvedPath });
    }

    const files = await fs.readdir(resolvedPath);
    const csvFiles = files.filter((file) => file.endsWith(".csv"));

    return csvFiles.map((file) => path.join(resolvedPath, file));
  } catch (error) {
    logger.error("Error listing CSV files", { 
      directory, 
      error: error.message 
    });
    return [];
  }
}

