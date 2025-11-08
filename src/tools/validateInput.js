export function validateLearnerResponses(responses) {
  if (!Array.isArray(responses)) {
    throw new Error("learnerResponses must be an array");
  }
  if (responses.length === 0) {
    throw new Error("learnerResponses array cannot be empty");
  }
  for (const r of responses) {
    if (typeof r.learner_id !== "string" || !Array.isArray(r.responses)) {
      throw new Error("Each item must have learner_id (string) and responses (array)");
    }
  }
  return true;
}
  