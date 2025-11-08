import { logger } from "../utils/logger.js";

// Simple in-memory DB substitute
// TODO: Replace with MongoDB or PostgreSQL when database is implemented
export const metricsMemory = {};

/**
 * Writes metrics to storage (currently in-memory, will be replaced with DB)
 * @param {string} sessionId - Unique session identifier
 * @param {Object} metrics - Metrics data to store
 * @returns {Promise<boolean>} - Success status
 */
export async function writeMetricsToDB(sessionId, metrics) {
  try {
    // For now: store metrics in memory
    metricsMemory[sessionId] = {
      ...metrics,
      storedAt: new Date().toISOString(),
    };

    logger.info("Saved metrics to storage", { 
      sessionId,
      source: metrics.source || "api"
    });

    // Later, replace with MongoDB or Postgres logic:
    /*
    const client = new MongoClient(MONGO_URL);
    await client.db("analytics").collection("metrics").insertOne({
      ...metrics,
      storedAt: new Date(),
    });
    */

    return true;
  } catch (error) {
    logger.error("Failed to write metrics to storage", {
      sessionId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Reads metrics from storage by sessionId
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Object|null>} - Metrics data or null if not found
 */
export async function readMetricsFromDB(sessionId) {
  try {
    // For now: read from memory
    const metrics = metricsMemory[sessionId] || null;

    if (metrics) {
      logger.debug("Read metrics from storage", { sessionId });
    }

    return metrics;
  } catch (error) {
    logger.error("Failed to read metrics from storage", {
      sessionId,
      error: error.message,
    });
    throw error;
  }
}
