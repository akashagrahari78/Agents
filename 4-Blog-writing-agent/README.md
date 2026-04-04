# Agent Blog

AI blog generation app with a React frontend, an Express backend, and a LangGraph-based Python writing agent.

The app lets a user enter a topic and blog preferences, generate a plan, review that plan with a human-in-the-loop approval step, and then continue into section drafting and final blog assembly.

## Features

- Blog generation with multiple providers:
  - Groq
  - OpenAI
  - Claude
- Human-in-the-loop outline review using LangGraph `interrupt(...)`
- Progress tracking from routing to final assembly
- Research-aware generation with Tavily
- Audience, tone, and target word count controls
- Optional code snippets, citations, and image planning
- Blog history stored in MongoDB
- Authenticated user accounts with JWT
- OpenAI usage guardrail:
  - max 2 OpenAI-generated blogs per user
- Frontend deployed separately from backend

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Zustand
- Axios
- Framer Motion
- React Markdown

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- Server-Sent Events for generation updates

### AI Agent

- Python
- LangGraph
- LangChain
- Tavily Search
- Groq / OpenAI / Anthropic models
- Optional Gemini image generation

## Project Structure

```text
4-Blog-writing-agent/
  backend/
    agent/
      main.py
      requirements.txt
    config/
      mongodb.js
    controllers/
    middleware/
    models/
    routes/
    services/
      agent_wrapper.py
      agentRunner.js
    dockerfile
    index.js
    package.json
  frontend/
    public/
    src/
      components/
      hooks/
      pages/
      store/
      utils/
    vercel.json
    package.json
  README.md
```

## How It Works

### Generation flow

1. User enters a topic and blog preferences in the frontend.
2. Frontend sends the request to `POST /api/generate`.
3. Backend starts the Python LangGraph agent.
4. Agent runs:
   - router
   - research if needed
   - orchestrator
5. After the outline is ready, LangGraph pauses with `interrupt(...)`.
6. Frontend shows the generated outline for human review.
7. If the user approves:
   - the graph resumes
   - worker nodes draft sections
   - reducer merges and formats the final blog
8. If the user rejects:
   - the graph loops back to the router
   - planning starts again

### HITL implementation

The human review step is implemented in:

- [main.py](C:/Users/akash/OneDrive/Desktop/GenAi/langgraph-agents/4-Blog-writing-agent/backend/agent/main.py)
- [agent_wrapper.py](C:/Users/akash/OneDrive/Desktop/GenAi/langgraph-agents/4-Blog-writing-agent/backend/services/agent_wrapper.py)
- [agentRunner.js](C:/Users/akash/OneDrive/Desktop/GenAi/langgraph-agents/4-Blog-writing-agent/backend/services/agentRunner.js)

Current behavior:

- checkpoints are stored with LangGraph `InMemorySaver()`
- resume happens through `Command(resume=...)`
- paused sessions live only in backend memory

Important:

- if the backend restarts, paused HITL sessions are lost
- free Render sleep/restarts can affect in-progress sessions

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Generation

- `POST /api/generate`
- `POST /api/generate/review`

### Blogs

- `GET /api/blogs`
- `GET /api/blogs/:id`
- `PATCH /api/blogs/:id`
- `DELETE /api/blogs/:id`


## Environment Variables

### Backend

Add these in your backend `.env` or Render environment settings:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
TAVILY_API_KEY=your_tavily_api_key
GOOGLE_API_KEY=your_google_api_key
FRONTEND_URL=http://localhost:5173
PORT=3000
```

Notes:

- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and `GOOGLE_API_KEY` are optional depending on features used.
- `FRONTEND_URL` is important for deployment and CORS.

### Frontend

```env
VITE_API_BASE_URL=http://localhost:3000
```

For production on Vercel:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

## Local Development

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd 4-Blog-writing-agent
```

### 2. Start the backend

```bash
cd backend
npm install
pip install -r agent/requirements.txt
npm run dev
```

### 3. Start the frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Frontend:

```text
http://localhost:5173
```


## Deployment

### Frontend on Vercel

Set the Vercel root directory to:

```text
4-Blog-writing-agent/frontend
```

Important files:

- [vercel.json](C:/Users/akash/OneDrive/Desktop/GenAi/langgraph-agents/4-Blog-writing-agent/frontend/vercel.json)

The rewrite config is required so refreshes on routes like `/generate` and `/history` do not return 404.

Also set:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

### Backend on Render

If you deploy using the current Node runtime setup:

- Root Directory:
  `4-Blog-writing-agent/backend`
- Build Command:
  `npm install && pip install -r agent/requirements.txt`
- Start Command:
  `npm start`

You can also use the backend Docker setup later if you want a more controlled Node + Python environment.

## Current Guardrails

- Topic input is limited to 30 words on the frontend
- Generate button is disabled for invalid topic input
- Final blog length is constrained to stay close to the requested word count
- OpenAI generation is limited to 2 blogs per user
- Each user can store up to 8 blogs in history

## Known Limitations

- HITL checkpoints are stored in memory, not in a persistent database
- Render free tier can sleep after inactivity, which may slow the first request
- If the backend restarts, paused plan-review sessions are lost
- Local image/file output generated by Python should not be treated as persistent in cloud deployments
