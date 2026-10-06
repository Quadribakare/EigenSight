# Sector Eigen-Correlation Explorer (Vercel)

**Live:** https://eigen-correlation-vercel.vercel.app/

Pick a stock → an AI layer figures out which sectors/themes it belongs to
→ AI proposes peer stocks in that sector, validated and ranked by live
market cap → recent price history is pulled for the group → PCA /
eigen-decomposition runs on daily returns → the app answers one direct
question: **if this stock moves, does the rest of the group move with
it — yes or no, and which way?**

Next.js/Vercel port of the original
[Streamlit app](https://github.com/chichihayes/ai-sector-eigen-correlation-explorer) —
same visuals, same analysis pipeline, same AI layer.

## How it works

1. **Sector discovery** (`api/sectors.py` → `api/_core/ai_discovery.py`) —
   given a ticker, an LLM (via OpenRouter) returns every sector/theme it
   plausibly belongs to, open-ended rather than picked from a fixed list
   (e.g. NVDA comes back as `["Semiconductors", "AI Infrastructure",
   "Data Center Hardware", "Graphics Processing Units"]`). The sidebar
   shows these as a dropdown — pick which one to analyze against.
2. **Peer discovery** (`api/peers.py` → `api/_core/ai_discovery.py` +
   `api/_core/data_fetcher.py`) — for the chosen sector, the LLM proposes
   up to 20 candidate tickers. Every candidate is checked against
   yfinance: no market cap means the ticker doesn't actually resolve, so
   it's dropped. Survivors are ranked by live market cap; a sidebar
   slider picks how many of the top-ranked ones to actually compare
   against (default 10).
3. **Price + market cap fetch** (`api/_core/data_fetcher.py`) — yfinance,
   no key required.
4. **PCA / eigen-decomposition** (`api/analyze.py` →
   `api/_core/pca_engine.py`) — daily returns are centered and their
   covariance matrix eigen-decomposed via `eigh` (numerically correct for
   symmetric matrices).
5. **Relationship call** (`api/_core/pca_engine.py::relationship_table`) —
   for every peer, its correlation with the target ticker is turned into
   a direct, deterministic Yes/No: `|correlation| >= 0.5` means "yes, real
   relationship" (direction from the sign); below that, "no reliable
   relationship." No AI involved in this step — it's the actual data, not
   a summary of it.
6. **AI explanation** (`api/explain.py` → `api/_core/ai_analyst.py`) — the
   relationship table plus each ticker's real % price change over the
   fetch window are sent to an LLM for a short, plain-English answer to
   "if this stock moves, does the rest of the group move with it?"

## Architecture

- **Frontend**: Next.js App Router (`app/`, `components/`) — client-side
  fetch calls to the API routes below, no server framework in between.
- **Backend**: four Python serverless functions under `api/` (`sectors`,
  `peers`, `analyze`, `explain`), each a thin `BaseHTTPRequestHandler`
  wrapper around shared logic in `api/_core/`. Vercel auto-detects any
  `.py` file directly under `api/` as its own function — no framework or
  router needed there.
- `requirements.txt` at the repo root installs the Python function
  dependencies (pandas, numpy, yfinance, requests, python-dotenv).

## Local development

```bash
npm install
cp .env.example .env   # fill in OPENROUTER_API_KEY
npm run dev
```

The Python API routes need the [Vercel CLI](https://vercel.com/docs/cli)
(`vercel dev`) to run locally, since `npm run dev` only serves the Next.js
frontend.

## Deployment

Deployed on [Vercel](https://vercel.com). Framework Preset auto-detects
as Next.js since `package.json` sits at the repo root. Set
`OPENROUTER_API_KEY` under Project → Settings → Environment Variables —
get a key at [openrouter.ai](https://openrouter.ai).
