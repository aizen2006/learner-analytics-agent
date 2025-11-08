# Learner Analytics Agent

A multi-agent analytics system that analyzes learner response data using OpenAI Agents SDK. This system computes comprehensive metrics including engagement, completion, mastery, ratings, and market insights through coordinated specialist AI agents.

## 🎯 What This Does

This system takes learner response data (from API or CSV files) and uses multiple specialized AI agents to compute analytics metrics:

- **Engagement Rate** - How engaged learners are with content
- **Completion Rate** - Percentage of learners who completed modules
- **Mastery Scores** - Assessment correctness and strength metrics
- **Ratings** - Average learner feedback ratings
- **Market Insights** - Business metrics like readiness thresholds and health scores

## 🚀 Quick Start

### Prerequisites

- Node.js 22 or later
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd learner-analytics-agent
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

   Server will start on `http://localhost:5000`

## 📖 API Usage

### Analyze Learner Responses (JSON)

```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "learnerResponses": [
      {
        "learner_id": "learner_001",
        "responses": [
          {
            "question_id": "q1",
            "answer": "Answer A",
            "correct": true,
            "completed": true,
            "rating": 4
          }
        ]
      }
    ],
    "moduleId": "module_123",
    "cohort": "cohort_2024"
  }'
```

### Analyze from CSV File

1. Place your CSV file in the `data/` directory (see `data/example_learner_responses.csv` for format)

2. Analyze:
   ```bash
   curl -X POST http://localhost:5000/csv/analyze \
     -H "Content-Type: application/json" \
     -d '{
       "csvFilePath": "data/example_learner_responses.csv",
       "moduleId": "module_123",
       "cohort": "cohort_2024"
     }'
   ```

### Get Metrics

```bash
# Get all metrics
curl http://localhost:5000/metrics

# Get metrics by module
curl http://localhost:5000/metrics?moduleId=module_123

# Get metrics by session
curl http://localhost:5000/metrics?sessionId=module_123-2024-01-01T00-00-00-000Z
```

### Health Check

```bash
curl http://localhost:5000/health
```

## 📁 CSV File Format

CSV files should have these columns:

| Column | Required | Description |
|--------|----------|-------------|
| `learner_id` | ✅ Yes | Unique learner identifier |
| `question_id` | No | Question identifier |
| `answer` | No | Answer text |
| `correct` | No | Boolean (true/false) |
| `completed` | No | Boolean (true/false) |
| `rating` | No | Number (1-5) |
| `timestamp` | No | ISO timestamp |

**Example:**
```csv
learner_id,question_id,answer,correct,completed,rating,timestamp
learner_001,q1,Answer A,true,true,4,2024-01-01T10:00:00Z
learner_001,q2,Answer B,true,true,5,2024-01-01T10:05:00Z
```

## 🏗️ Architecture

The system uses a **manager-agent pattern**:

```
Manager Agent (orchestrator)
├── Engagement Analyst Agent
├── Completion Analyst Agent  
├── Mastery Analyst Agent
├── Rating Analyst Agent
└── Market Insight Analyst Agent
```

Each specialist agent:
- Processes data in parallel for efficiency
- Has domain-specific instructions
- Validates inputs and outputs
- Returns structured JSON results

## 📊 Response Format

All analysis endpoints return:

```json
{
  "success": true,
  "message": "Analysis completed successfully",
  "sessionId": "module_123-2024-01-01T00-00-00-000Z",
  "data": {
    "numberOfLearners": 10,
    "engagementRate": 0.85,
    "completionRate": 0.90,
    "averageRating": 4.2,
    "objectiveScore": 0.88,
    "STR": 0.92,
    "strPercent": 85,
    "csr": 0.15,
    "cod": 0.20,
    "insightIndex": 0.87,
    "moduleId": "module_123",
    "cohort": "cohort_2024",
    "analyzedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🛠️ Project Structure

```
learner-analytics-agent/
├── src/
│   ├── agents/          # AI agent definitions
│   ├── routes/          # API endpoints
│   ├── schemas/         # Data validation schemas
│   ├── tools/           # Utility functions
│   ├── utils/           # Helper utilities
│   └── middleware/      # Express middleware
├── data/                # CSV data files
├── .env.example         # Environment variables template
├── Dockerfile           # Docker configuration
└── README.md            # This file
```

## 🐳 Docker

Build and run with Docker:

```bash
docker build -t learner-analytics-agent .
docker run -p 5000:5000 \
  -e OPENAI_API_KEY=your_key_here \
  learner-analytics-agent
```

## 🚀 Deployment

See [DEPLOY.md](./DEPLOY.md) for deployment instructions on:
- Render
- Fly.io
- Railway
- Heroku

## 📝 Environment Variables

Required:
- `OPENAI_API_KEY` - Your OpenAI API key

Optional:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (default: development)
- `LOG_LEVEL` - Logging level (default: info)

See `.env.example` for all options.

## 🔍 What's Implemented

✅ Multi-agent orchestration  
✅ Parallel agent execution  
✅ Input/output validation  
✅ CSV file support  
✅ Rate limiting  
✅ Error handling with retries  
✅ Structured logging  
✅ Health checks  
✅ Metrics collection  
✅ Graceful shutdown  

## 📋 Next Steps for Production

See [NEXT_STEPS.md](./NEXT_STEPS.md) for a comprehensive list of what needs to be added for production deployment, including:
- Database implementation
- Authentication & authorization
- Testing infrastructure
- Enhanced monitoring
- And more...

## 🐛 Troubleshooting

**Server won't start:**
- Check that `OPENAI_API_KEY` is set in `.env`
- Verify Node.js version is 22+
- Check port 5000 is not in use

**CSV file not found:**
- Ensure file path is relative to project root
- Check file exists in `data/` directory
- Verify CSV format matches expected columns

**Agent errors:**
- Check OpenAI API key is valid
- Verify API quota/credits available
- Check logs for detailed error messages

## 📚 Resources

- [OpenAI Agents SDK Docs](https://openai.github.io/openai-agents-js/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 📄 License

ISC

## 👤 Author

Soubhik Halder

---

**Note:** This is a demo/proof-of-concept build. See `NEXT_STEPS.md` for production requirements.
