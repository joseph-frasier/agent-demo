# Irongrove Demo

AI-powered sales pipeline demo that uses Claude to enrich leads, run agent workflows, and generate branded microsites.

## Architecture

This is a monorepo with two packages:

| Package | Tech | Port | Description |
|---------|------|------|-------------|
| `client/` | Next.js (App Router) | 3000 | Frontend UI |
| `server/` | Express + Anthropic SDK | 3001 | API server — Claude agents, Unsplash images, site generation |

The Next.js client proxies all `/api/*` requests to the Express server on port 3001. Both must be running for the app to work.

## Prerequisites

- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com/)
- An [Unsplash access key](https://unsplash.com/developers)

## Setup

1. **Clone the repo and install dependencies in all three locations:**

   ```bash
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

2. **Create a `.env` file in the project root** with your API keys:

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   UNSPLASH_ACCESS_KEY=...
   ```

   The server reads this file automatically — no other env configuration is needed.

3. **Start the dev server:**

   ```bash
   npm run dev
   ```

   This uses `concurrently` to start both the client (blue) and server (green) in one terminal. You should see output from both before the app is ready.

## Troubleshooting

**"Failed to fetch" errors in the browser**
The Express server on port 3001 isn't running. Check that:
- You ran `npm install --prefix server` (not just root `npm install`)
- The `.env` file exists at the project root with valid keys
- Nothing else is using port 3001 (`lsof -i :3001`)

**Server starts then immediately crashes**
Usually a missing or malformed `ANTHROPIC_API_KEY`. Check the green (server) output in the terminal for the actual error.

**Only the client starts**
Look for errors in the green (server) output. The most common cause is missing server dependencies — run `npm install --prefix server` and restart.
