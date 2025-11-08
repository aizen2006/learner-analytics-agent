/**
 * Simple in-memory metrics collector
 * In production, consider using Prometheus or similar
 */

const metrics = {
  requests: {
    total: 0,
    byStatus: {},
    byEndpoint: {},
  },
  agents: {
    total: 0,
    success: 0,
    failures: 0,
    byAgent: {},
  },
  latency: {
    analyze: [],
    agents: [],
  },
  errors: {
    total: 0,
    byType: {},
  },
};

/**
 * Record a request metric
 */
export function recordRequest(endpoint, statusCode, duration) {
  metrics.requests.total++;
  
  if (!metrics.requests.byStatus[statusCode]) {
    metrics.requests.byStatus[statusCode] = 0;
  }
  metrics.requests.byStatus[statusCode]++;

  if (!metrics.requests.byEndpoint[endpoint]) {
    metrics.requests.byEndpoint[endpoint] = { count: 0, totalDuration: 0 };
  }
  metrics.requests.byEndpoint[endpoint].count++;
  metrics.requests.byEndpoint[endpoint].totalDuration += duration;

  if (endpoint === "/analyze") {
    metrics.latency.analyze.push(duration);
    // Keep only last 100 measurements
    if (metrics.latency.analyze.length > 100) {
      metrics.latency.analyze.shift();
    }
  }
}

/**
 * Record an agent execution metric
 */
export function recordAgentExecution(agentName, success, duration) {
  metrics.agents.total++;
  
  if (success) {
    metrics.agents.success++;
  } else {
    metrics.agents.failures++;
  }

  if (!metrics.agents.byAgent[agentName]) {
    metrics.agents.byAgent[agentName] = { success: 0, failures: 0, totalDuration: 0 };
  }
  
  if (success) {
    metrics.agents.byAgent[agentName].success++;
  } else {
    metrics.agents.byAgent[agentName].failures++;
  }
  
  metrics.agents.byAgent[agentName].totalDuration += duration;

  metrics.latency.agents.push(duration);
  if (metrics.latency.agents.length > 100) {
    metrics.latency.agents.shift();
  }
}

/**
 * Record an error
 */
export function recordError(errorType, errorMessage) {
  metrics.errors.total++;
  
  if (!metrics.errors.byType[errorType]) {
    metrics.errors.byType[errorType] = 0;
  }
  metrics.errors.byType[errorType]++;
}

/**
 * Get current metrics
 */
export function getMetrics() {
  const avgAnalyzeLatency = metrics.latency.analyze.length > 0
    ? metrics.latency.analyze.reduce((a, b) => a + b, 0) / metrics.latency.analyze.length
    : 0;

  const avgAgentLatency = metrics.latency.agents.length > 0
    ? metrics.latency.agents.reduce((a, b) => a + b, 0) / metrics.latency.agents.length
    : 0;

  return {
    requests: {
      ...metrics.requests,
      averageLatency: {
        analyze: Math.round(avgAnalyzeLatency),
        agents: Math.round(avgAgentLatency),
      },
    },
    agents: {
      ...metrics.agents,
      successRate: metrics.agents.total > 0
        ? (metrics.agents.success / metrics.agents.total * 100).toFixed(2) + "%"
        : "0%",
    },
    errors: metrics.errors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics() {
  Object.keys(metrics).forEach((key) => {
    if (Array.isArray(metrics[key])) {
      metrics[key] = [];
    } else if (typeof metrics[key] === "object") {
      metrics[key] = {};
    } else {
      metrics[key] = 0;
    }
  });
}

