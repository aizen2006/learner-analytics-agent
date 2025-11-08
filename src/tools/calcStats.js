/**
 * Calculates basic statistics from learner responses
 * @param {Array} responses - Array of learner responses
 * @returns {Object} - Statistics object with numberOfLearners
 */
export function calculateCounts(responses) {
  const numberOfLearners = responses.length;
  return { numberOfLearners };
}
  