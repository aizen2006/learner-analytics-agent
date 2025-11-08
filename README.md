# Learner Analytics Agent

A production-ready multi-agent system built with OpenAI Agents SDK that analyzes learner response data and computes comprehensive analytics metrics including engagement, completion, mastery, ratings, and market insights.

## 🚀 Features

- **Multi-Agent Architecture**: Coordinated specialist agents for different analytics domains
- **Comprehensive Metrics**: Calculates engagement rate, completion rate, mastery scores, ratings, and market insights
- **Parallel Processing**: Efficient parallel execution of specialist agents
- **Input Validation**: Robust validation using Zod schemas
- **Guardrails**: Built-in input/output validation for safety and reliability
- **Session Management**: Context-aware processing with session memory
- **RESTful API**: Clean Express.js API for integration

## 📊 Analytics Metrics

The system computes the following metrics:

- **engagementRate**: Measures learner interaction with content (0-1)
- **completionRate**: Percentage of learners who completed the module (0-1)
- **averageRating**: Mean rating from learner feedback (1-5)
- **objectiveScore**: Average correctness score from assessments (0-1)
- **STR**: Strength-to-completion composite score (0-1)
- **strPercent**: Percentage of learners meeting readiness threshold (0-100)
- **csr**: Conversion stopping ratio (0-1)
- **cod**: Client objection demand (0-1)
- **insightIndex**: Blended health score for overall module performance (0-1)

## 🏗️ Architecture

The system uses a manager-agent pattern with specialized analyst agents:

```
Manager Agent
├── Engagement Analyst Agent
├── Completion Analyst Agent
├── Mastery Analyst Agent
├── Rating Analyst Agent
└── Market Insight Analyst Agent
```

Each specialist agent:
- Has focused instructions for its domain
- Uses tools for validation and calculations
- Implements guardrails for input/output validation
- Returns structured JSON output

## 📦 Installation

### Prerequisites

- Node.js 22 or later
- npm or yarn
- OpenAI API key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/learner-analytics-agent.git
cd learner-analytics-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## 📖 API Documentation

### POST /analyze

Analyzes learner response data and returns comprehensive metrics.

**Request Body:**
```json
{
  "learnerResponses": [
    {
      "learner_id": "learner_123",
      "responses": [
        {
          "question_id": "q1",
          "answer": "answer_text",
          "correct": true,
          "completed": true,
          "rating": 4,
          "timestamp": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ],
  "moduleId": "module_123",
  "cohort": "cohort_2024"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Analysis completed successfully",
  "sessionId": "module_123-2024-01-01T00-00-00-000Z",
  "data": {
    "numberOfLearners": 1,
    "engagementRate": 0.85,
    "completionRate": 1.0,
    "averageRating": 4.0,
    "objectiveScore": 0.9,
    "STR": 0.95,
    "strPercent": 100,
    "csr": 0.1,
    "cod": 0.2,
    "insightIndex": 0.85,
    "sessionId": "module_123-2024-01-01T00-00-00-000Z",
    "moduleId": "module_123",
    "cohort": "cohort_2024",
    "analyzedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /metrics

Retrieves stored metrics. Supports filtering by `moduleId` or `sessionId`.

**Query Parameters:**
- `moduleId` (optional): Filter by module ID
- `sessionId` (optional): Get specific session metrics

**Examples:**
```bash
# Get all metrics
GET /metrics

# Get metrics for a specific module
GET /metrics?moduleId=module_123

# Get metrics for a specific session
GET /metrics?sessionId=module_123-2024-01-01T00-00-00-000Z
```

## 🧪 Usage Examples

### Basic Analysis

```javascript
const axios = require('axios');

const response = await axios.post('http://localhost:5000/analyze', {
  learnerResponses: [
    {
      learner_id: 'learner_1',
      responses: [
        {
          question_id: 'q1',
          answer: 'answer',
          correct: true,
          completed: true,
          rating: 5
        }
      ]
    }
  ],
  moduleId: 'module_1',
  cohort: 'cohort_2024'
});

console.log(response.data);
```

### Retrieving Metrics

```javascript
// Get all metrics
const allMetrics = await axios.get('http://localhost:5000/metrics');

// Get metrics for a specific module
const moduleMetrics = await axios.get('http://localhost:5000/metrics?moduleId=module_1');
```

## 🛠️ Development

### Project Structure

```
learner-analytics-agent/
├── src/
│   ├── agents/
│   │   ├── managerAgent.js      # Main orchestrator agent
│   │   ├── engagementAgent.js   # Engagement metrics agent
│   │   ├── completionAgent.js   # Completion metrics agent
│   │   ├── masteryAgent.js      # Mastery metrics agent
│   │   ├── ratingAgent.js       # Rating metrics agent
│   │   ├── marketAgent.js        # Market insights agent
│   │   └── index_src.js         # Agent exports
│   ├── routes/
│   │   ├── analyze.js           # Analysis endpoint
│   │   └── metrics.js           # Metrics retrieval endpoint
│   ├── tools/
│   │   ├── validateInput.js     # Input validation utilities
│   │   ├── calcStats.js         # Statistical calculations
│   │   └── dbWrite.js           # Database operations
│   └── index.js                 # Express server setup
├── package.json
└── README.md
```

### Running in Development

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server on file changes.

## 🔒 Security Considerations

- **API Key Protection**: Never commit your `.env` file or API keys
- **Input Validation**: All inputs are validated using Zod schemas
- **Rate Limiting**: Consider implementing rate limiting for production
- **Error Handling**: Sensitive error details are not exposed to clients

## 🚧 Roadmap

- [ ] Database persistence (currently in-memory)
- [ ] Comprehensive test suite
- [ ] Rate limiting middleware
- [ ] Structured logging with Winston/Pino
- [ ] Health check endpoint
- [ ] Metrics monitoring and observability
- [ ] TypeScript migration
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] API documentation with Swagger/OpenAPI

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👤 Author

**Soubhik Halder**

## 🙏 Acknowledgments

- Built with [OpenAI Agents SDK](https://github.com/openai/openai-agents-js)
- Uses [Express.js](https://expressjs.com/) for the API
- Validation powered by [Zod](https://github.com/colinhacks/zod)

## 📚 Resources

- [OpenAI Agents SDK Documentation](https://openai.github.io/openai-agents-js/)
- [OpenAI Agents SDK GitHub](https://github.com/openai/openai-agents-js)
- [Express.js Documentation](https://expressjs.com/)
- [Zod Documentation](https://zod.dev/)

## ⚠️ Important Notes

- This is currently a development version. Production deployment requires additional work on error handling, logging, database persistence, and testing.
- The current implementation uses in-memory storage. Data will be lost on server restart.
- Ensure you have sufficient OpenAI API credits before processing large datasets.
- Monitor API usage to avoid unexpected costs.

## 🐛 Known Issues

- In-memory storage (data lost on restart)
- No retry logic for transient API failures
- Limited error recovery mechanisms
- No timeout protection for long-running analyses

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ using OpenAI Agents SDK

