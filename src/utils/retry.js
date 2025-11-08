/**
 * Retry utility with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum number of attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried (default: retry all)
 * @returns {Promise} - Result of the function
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts or if error shouldn't be retried
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Determines if an error is transient and should be retried
 * @param {Error} error - The error to check
 * @returns {boolean} - True if error should be retried
 */
export function isTransientError(error) {
  // Network errors, timeouts, and rate limits are typically transient
  if (error.code === "ECONNRESET" || 
      error.code === "ETIMEDOUT" || 
      error.code === "ENOTFOUND" ||
      error.message?.includes("timeout") ||
      error.message?.includes("rate limit") ||
      error.status === 429 ||
      error.status === 503 ||
      error.status === 502) {
    return true;
  }
  return false;
}

