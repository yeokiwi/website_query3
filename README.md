# Website Change Monitor

A full-stack web application that accepts any URL and uses an AI agent (Claude + Brave Search) to investigate and report what has changed on the site in the last 30 days. Results stream to the UI in real time via Server-Sent Events.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Node.js + Express |
| LLM | Anthropic Claude API (claude-sonnet-4-6, tool use) |
| Web Search | Brave Search API |
| URL Fetching | Axios + Cheerio (Playwright optional) |
| Streaming | Server-Sent Events (SSE) |

## Prerequisites

- **Node.js** 18 or later
- An **Anthropic API key** — [get one here](https://console.anthropic.com/)
- A **Brave Search API key** — [get one here](https://brave.com/search/api/)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yeokiwi/website_query3.git
cd website_query3
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `server/` directory (a template already exists):

```bash
cp .env .env.backup   # optional, keep the template
```

Edit `server/.env` and fill in your keys:

```env
# Required
ANTHROPIC_API_KEY=sk-ant-your-key-here
BRAVE_API_KEY=BSAyour-key-here

# Optional
USE_PLAYWRIGHT=false   # set to true to enable JS-rendered page fetching
PORT=3001              # backend port
MAX_AGENT_ITERATIONS=10
MAX_FETCH_CHARS=15000
```

### 4. Install client dependencies

```bash
cd ../client
npm install
```

### 5. (Optional) Enable Playwright

If you want the fetcher to fall back to a headless browser for JavaScript-rendered pages:

```bash
cd ../server
USE_PLAYWRIGHT=true
npx playwright install chromium
```

## Running in Development

Open two terminals:

**Terminal 1 — Backend**

```bash
cd server
npm run dev
```

The Express server starts on `http://localhost:3001`.

**Terminal 2 — Frontend**

```bash
cd client
npm run dev
```

Vite starts on `http://localhost:5173` and proxies `/api` requests to the backend automatically.

Open **http://localhost:5173** in your browser.

## Production Build

```bash
# Build the frontend
cd client
npm run build

# Preview the production build
npm run preview
```

The built files are output to `client/dist/`. Serve them with any static file server and point `/api` requests to the Express backend.

## Usage

1. Enter a URL in the input bar (e.g. `https://stripe.com`)
2. Click **Analyze Changes**
3. Watch the **Agent Activity** panel as the AI searches the web and fetches pages
4. Read the streaming report that categorises changes as **Confirmed Recent** or **Likely Recent**
5. Click **Stop** to cancel an in-progress analysis, or **Clear** to reset

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/analyze` | POST | Starts an SSE stream analysing the given URL |
| `/api/health` | GET | Returns `{ "status": "ok" }` |

### SSE Event Types

| `type` | Fields | Description |
|---|---|---|
| `tool_start` | `tool`, `input` | Agent is calling a tool |
| `tool_end` | `tool`, `result_summary` | Tool call completed |
| `text_delta` | `delta` | Streamed text chunk from the LLM |
| `done` | — | Analysis complete |
| `error` | `message` | Fatal error |

## Project Structure

```
├── client/                        # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── UrlForm.jsx        # URL input + submit/stop/clear
│   │   │   ├── ResultsPanel.jsx   # Streaming results display
│   │   │   ├── ChangeCard.jsx     # Individual change item card
│   │   │   ├── StatusBadge.jsx    # Confirmed / Likely Recent badges
│   │   │   ├── ToolCallLog.jsx    # Live collapsible agent activity log
│   │   │   └── StreamingText.jsx  # Markdown renderer with blinking cursor
│   │   ├── hooks/
│   │   │   └── useSSEStream.js    # Custom hook to consume SSE
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                        # Node.js + Express backend
│   ├── routes/
│   │   └── analyze.js             # POST /api/analyze SSE endpoint
│   ├── services/
│   │   ├── llmAgent.js            # Claude agentic loop with tool use
│   │   ├── braveSearch.js         # Brave Search API wrapper
│   │   ├── urlFetcher.js          # Axios+Cheerio / Playwright fetcher
│   │   └── htmlParser.js          # HTML cleaner + truncator
│   ├── tools/
│   │   └── toolDefinitions.js     # Claude tool schemas
│   ├── app.js                     # Express entry point
│   └── .env                       # Environment variables
│
├── claude.md
└── README.md
```
