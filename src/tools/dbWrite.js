// Simple in-memory DB substitute
export const metricsMemory = {};

export async function writeMetricsToDB(sessionId, metrics) {
  // For now: store metrics in memory
  metricsMemory[sessionId] = metrics;
  console.log(`💾 Saved metrics for session ${sessionId}`);
  return true;

  // Later, replace with MongoDB or Postgres logic:
  /*
  const client = new MongoClient(MONGO_URL);
  await client.db("analytics").collection("metrics").insertOne(metrics);
  */
}
