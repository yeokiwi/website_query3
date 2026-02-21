# 🔍 Website Change Monitor

## Project Overview

Build a full-stack web application that allows users to submit any URL and receive an AI-powered analysis of what has **changed or been updated in the last 30 days**. The LLM uses browsing tools (Brave Search + URL fetching) to autonomously investigate the site and surfaces a structured, readable report in the UI via streaming.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Node.js + Express |
| LLM | Anthropic Claude API (with tool use) |
| Web Search | Brave Search API |
| URL Fetching | Axios + Cheerio (static) / Playwright (JS-rendered) |
| Streaming | Server-Sent Events (SSE) |

---

## Repository Structure

```
website-monitor/
├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── UrlForm.jsx          # URL input + submit button
│   │   │   ├── ResultsPanel.jsx     # Streaming results display
│   │   │   ├── ChangeCard.jsx       # Individual change item card
│   │   │   ├── StatusBadge.jsx      # "Confirmed" / "Likely Recent" badges
│   │   │   ├── ToolCallLog.jsx      # Live log of LLM tool calls (collapsible)
│   │   │   └── StreamingText.jsx    # Animated typewriter text for streamed output
│   │   ├── hooks/
│   │   │   └── useSSEStream.js      # Custom hook to consume SSE stream
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                         # Node.js + Express backend
│   ├── routes/
│   │   └── analyze.js              # POST /api/analyze — SSE streaming endpoint
│   ├── services/
│   │   ├── llmAgent.js             # Anthropic Claude agentic loop with tool use
│   │   ├── braveSearch.js          # Brave Search API wrapper
│   │   ├── urlFetcher.js           # Axios+Cheerio / Playwright fetcher
│   │   └── htmlParser.js           # Clean + truncate HTML for LLM context
│   ├── tools/
│   │   └── toolDefinitions.js      # Claude tool schemas (web_search, fetch_url)
│   ├── app.js
│   └── .env
│
└── README.md
```

---

## Detailed Feature Requirements

### 1. Frontend — URL Input Form (`UrlForm.jsx`)

- A single text input for the target URL with basic URL validation
- A "Analyze Changes" submit button that triggers the SSE stream
- The input and button should be disabled while a stream is in progress
- Show a subtle animated pulse or spinner while the agent is working
- Clear/reset button to start a new analysis

---

### 2. Frontend — Results Panel (`ResultsPanel.jsx`)

The results panel renders the LLM output in a structured, readable format as it streams in. It must display:

**a) Tool Call Activity Log (live, collapsible)**

Show a real-time collapsible sidebar or inline section titled "Agent Activity" that lists each tool call as it happens:
- `🔍 Searching: "<query>"` — when Brave Search is called
- `🌐 Fetching: "<url>"` — when a URL is fetched
- Include the timestamp of each tool call

**b) Streaming Analysis Output**

Stream and render the final LLM report in structured sections:

```
## Recent Changes Detected
[Summary paragraph]

### ✅ Confirmed Recent (with dates)
- [change item with source/evidence]

### 🟡 Likely Recent (inferred from context)
- [change item with reasoning]

### 📌 What Appears Unchanged
- [stable section notes]

### 🔗 Sources Checked
- [list of URLs visited]
```

Each section should fade in as it streams. Use `ChangeCard.jsx` to render individual change items with a `StatusBadge.jsx` showing either **"Confirmed"** (green) or **"Likely Recent"** (amber).

---

### 3. Backend — SSE Streaming Endpoint (`/api/analyze`)

**Route:** `POST /api/analyze`

**Request body:**
```json
{ "url": "https://example.com" }
```

**Behavior:**
1. Set headers for SSE: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
2. Instantiate the LLM agent and begin the agentic loop
3. Stream SSE events of the following types to the client as they occur:

```js
// Tool call started
data: { "type": "tool_start", "tool": "web_search", "input": { "query": "..." } }

// Tool call completed
data: { "type": "tool_end", "tool": "web_search", "result_summary": "5 results returned" }

// LLM text delta (streaming)
data: { "type": "text_delta", "delta": "## Recent Changes..." }

// Stream complete
data: { "type": "done" }

// Error
data: { "type": "error", "message": "..." }
```

4. Keep the connection alive until the agent finishes or errors out
5. Handle client disconnects gracefully (abort the agentic loop)

---

### 4. Backend — LLM Agent (`llmAgent.js`)

Implement a full **agentic tool-use loop** using the Anthropic Claude API (`claude-sonnet-4-6` model).

#### System Prompt

```
You are a web research assistant specializing in detecting recent changes on websites.
You have access to tools to search the web and fetch URLs.
Your goal is to determine what has changed on a given website in the last 30 days.
Be thorough — check the main page, blog/news sections, changelog pages, and any relevant search results.
Always distinguish between changes you can CONFIRM (have explicit dates) vs. changes that appear recent based on context.
```

#### User Prompt Template

```
I need you to examine {URL} and focus specifically on:
- What's new or changed in the last 30 days?
- Any announcements, blog posts, or news from the past month
- Updates to products, services, or features
- Changes to pricing, terms of service, or policies

Please distinguish between what you can confirm as recent vs. what appears to be recent based on dates or context.

Today's date is {CURRENT_DATE}.
```

#### Agentic Loop

```
while (true) {
  1. Call Claude API with current messages array + tool definitions
  2. Stream text deltas → emit SSE "text_delta" events
  3. If stop_reason === "end_turn" → emit SSE "done", break
  4. If stop_reason === "tool_use":
       a. Parse all tool_use blocks from response
       b. Emit SSE "tool_start" for each
       c. Execute each tool (web_search or fetch_url)
       d. Emit SSE "tool_end" for each
       e. Append tool results to messages as "tool_result"
       f. Continue loop
  5. Cap at 10 iterations to avoid infinite loops
}
```

---

### 5. Backend — Tool Definitions (`toolDefinitions.js`)

Define the following two tools for Claude:

#### Tool 1: `web_search`

```json
{
  "name": "web_search",
  "description": "Search the web using Brave Search. Use this to find recent news, announcements, or changes related to a website or company.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query. Be specific and include the site name + 'recent changes', 'new features', 'announcements', etc."
      },
      "freshness": {
        "type": "string",
        "enum": ["pd", "pw", "pm"],
        "description": "Filter results by recency: pd=past day, pw=past week, pm=past month"
      }
    },
    "required": ["query"]
  }
}
```

#### Tool 2: `fetch_url`

```json
{
  "name": "fetch_url",
  "description": "Fetch the HTML content of a URL and extract its readable text. Use this to read the homepage, blog, changelog, or any page directly.",
  "input_schema": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "description": "The full URL to fetch"
      },
      "selector": {
        "type": "string",
        "description": "Optional CSS selector to extract only a specific section of the page (e.g. 'article', '.changelog', 'main')"
      }
    },
    "required": ["url"]
  }
}
```

---

### 6. Backend — Brave Search Service (`braveSearch.js`)

```js
// GET https://api.search.brave.com/res/v1/web/search
// Headers: { "Accept": "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": BRAVE_API_KEY }
// Params: { q: query, freshness, count: 5, text_decorations: false }
// Return: array of { title, url, description } from web results
```

Error handling:
- Retry once on 429 (rate limit) with 1s delay
- Return empty array on failure with a logged warning (do not throw)

---

### 7. Backend — URL Fetcher (`urlFetcher.js`)

```js
// Primary: Axios + Cheerio for static pages
// Fallback: Playwright for JS-rendered pages (detect by empty body after Axios)

// Steps:
// 1. Axios GET with realistic headers (user-agent, accept-language, etc.)
// 2. Parse HTML with Cheerio
// 3. If selector provided: extract that element only
// 4. Otherwise: remove <script>, <style>, <nav>, <footer>, <header>, <aside>
// 5. Extract text with cheerio .text()
// 6. Truncate to 15,000 characters max (with a note appended: "[content truncated]")
// 7. Return { url, text, truncated: boolean }

// Playwright fallback (optional, gated by USE_PLAYWRIGHT=true env var):
// - Launch headless Chromium
// - Navigate with 15s timeout
// - Wait for networkidle
// - Extract body text
// - Close browser
```

---

### 8. Frontend — SSE Hook (`useSSEStream.js`)

```js
// Custom React hook
// Input: { url (string), body (object) }
// Output: { toolCalls, textChunks, isStreaming, error, startStream }

// Implementation:
// - Use fetch() with ReadableStream to consume SSE
// - Parse each "data: {...}" line as JSON
// - Dispatch to state based on event type:
//     "tool_start" / "tool_end" → append to toolCalls array
//     "text_delta" → append delta to textBuffer string
//     "done" → set isStreaming = false
//     "error" → set error state
// - Expose startStream() function to trigger a new analysis
// - Cancel/abort previous stream if a new one starts
```

---

## Environment Variables

```env
# server/.env

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Brave Search
BRAVE_API_KEY=BSA...

# Optional
USE_PLAYWRIGHT=false
PORT=3001
MAX_AGENT_ITERATIONS=10
MAX_FETCH_CHARS=15000
```

---

## UI Design Specification

**Aesthetic direction:** Dark, terminal-inspired intelligence dashboard. Think "security researcher meets modern SaaS." Use a dark charcoal/near-black base (`#0f1117`) with electric teal accents (`#00e5cc`). Monospaced font for tool logs; a sharp sans-serif for headings; readable serif or humanist sans for body text.

**Key UI components:**

- **Header:** Logo/wordmark on left, subtle tagline ("AI-powered website change detection")
- **Input area:** Full-width URL bar with teal focus ring, animated submit button that morphs into a stop button while streaming
- **Agent Activity Panel:** Collapsible left column or top section. Each tool call appears with a slide-in animation. Dim completed calls, highlight the active one with a pulsing indicator
- **Results Area:** Main content panel with Markdown-like sections. Text streams in with a blinking cursor. Section headers (`###`) render as styled dividers. Status badges for confirmed vs. inferred changes
- **Empty/Idle State:** Centered prompt with example URLs and a brief explanation of what the tool does
- **Error State:** Red-bordered card with error message and retry button

---

## API Contracts Summary

| Endpoint | Method | Description |
|---|---|---|
| `/api/analyze` | POST | Starts SSE stream for a given URL analysis |
| `/api/health` | GET | Returns `{ status: "ok" }` |

**SSE Event Types:**

| `type` | Payload fields | Description |
|---|---|---|
| `tool_start` | `tool`, `input` | Agent is calling a tool |
| `tool_end` | `tool`, `result_summary` | Tool call completed |
| `text_delta` | `delta` | Streamed text chunk from LLM |
| `done` | — | Analysis complete |
| `error` | `message` | Fatal error |

---

## Implementation Notes & Guardrails

1. **Rate limiting:** Add a simple in-memory rate limiter on `/api/analyze` — max 5 requests per IP per minute
2. **Timeout:** Abort the entire agent run after 90 seconds and emit an `error` event
3. **URL validation:** Validate that the submitted URL is a valid `http` or `https` URL before starting. Reject `localhost`, `127.0.0.1`, and private IP ranges (SSRF protection)
4. **Truncation strategy:** Always truncate fetched content before sending to Claude. Log the original vs. truncated character count server-side
5. **Tool call cap:** Hard-cap the agentic loop at `MAX_AGENT_ITERATIONS` (default 10) to control cost
6. **CORS:** Configure Express CORS to allow only the Vite dev server origin in development (`http://localhost:5173`) and the production domain in production
7. **Playwright:** Keep Playwright as an opt-in feature (`USE_PLAYWRIGHT=true`) since it's heavier. Default to Axios+Cheerio only
8. **Streaming:** Use `res.write()` for SSE — do NOT use `res.json()`. Flush after each write with `res.flush()` if using compression middleware

---

## Acceptance Criteria

- [ ] User can submit a URL and receive a streaming analysis
- [ ] Tool calls (search queries + fetched URLs) are displayed live in the UI as they happen
- [ ] Final output clearly distinguishes **confirmed recent changes** from **likely recent changes**
- [ ] The UI remains responsive during streaming; the input is locked while a stream is active
- [ ] Errors (network failure, invalid URL, API error) are surfaced gracefully in the UI
- [ ] The agent stops automatically after `MAX_AGENT_ITERATIONS` tool calls
- [ ] Private/localhost URLs are rejected with a clear error message
- [ ] Works correctly in both development (Vite dev server + Express) and a production build
