# Deployment Guide

Quick deployment instructions for popular platforms.

## Prerequisites

- Node.js 22+ installed locally (for testing)
- Git repository set up
- OpenAI API key

## Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your `OPENAI_API_KEY`
3. Install dependencies: `npm install`
4. Start the server: `npm run dev` or `npm start`
5. Server runs on `http://localhost:5000`

## Docker Deployment

### Build Image
```bash
docker build -t learner-analytics-agent .
```

### Run Container
```bash
docker run -p 5000:5000 \
  -e OPENAI_API_KEY=your_key_here \
  -e PORT=5000 \
  -e NODE_ENV=production \
  learner-analytics-agent
```

## Platform-Specific Deployments

### Render

1. Connect your GitHub repository to Render
2. Create a new "Web Service"
3. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. Add environment variables:
   - `OPENAI_API_KEY` (required)
   - `PORT` (optional, defaults to 5000)
   - `NODE_ENV=production`
5. Deploy!

**Note:** Render automatically detects Dockerfile if present.

### Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch app: `fly launch`
4. Set secrets:
   ```bash
   fly secrets set OPENAI_API_KEY=your_key_here
   fly secrets set NODE_ENV=production
   ```
5. Deploy: `fly deploy`

### Railway

1. Connect your GitHub repository to Railway
2. Create a new project
3. Add environment variables:
   - `OPENAI_API_KEY`
   - `NODE_ENV=production`
4. Railway auto-detects Node.js and deploys
5. Your app will be live at `https://your-app.railway.app`

### Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set config vars:
   ```bash
   heroku config:set OPENAI_API_KEY=your_key_here
   heroku config:set NODE_ENV=production
   ```
5. Deploy: `git push heroku main`

## Environment Variables

Required:
- `OPENAI_API_KEY` - Your OpenAI API key

Optional:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (default: info)

## Health Check

All deployments should configure health checks pointing to:
```
GET /health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

## Troubleshooting

### Port Issues
- Ensure `PORT` environment variable matches platform's expected port
- Some platforms (like Render) set `PORT` automatically

### API Key Issues
- Verify `OPENAI_API_KEY` is set correctly
- Check for extra spaces or quotes
- Ensure key has proper permissions

### Build Failures
- Check Node.js version (requires 22+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

## Production Checklist

- [ ] Environment variables configured
- [ ] Health check endpoint working
- [ ] Logs accessible
- [ ] Error tracking configured (if applicable)
- [ ] Database configured (if applicable)
- [ ] Rate limiting appropriate for production
- [ ] SSL/HTTPS enabled
- [ ] Monitoring set up

