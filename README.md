# RuthlessDeliveryRadar

RuthlessDeliveryRadar is a tiny SaaS-style MVP that tracks GitHub repository activity and computes a daily sprint risk score. It ingests public repo events, stores them locally in SQLite, and exposes a small Fastify API. Use it to watch team momentum and spot quiet days quickly.

## Getting started
1. Clone the repo and install dependencies: `npm install`.
2. Copy `.env.example` to `.env` and fill in `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO`.
3. Run the dev server: `npm run dev` (listens on `PORT`, default `3000`).
4. Build for production: `npm run build` then `npm start`.

## Example API calls
- Health: `curl http://localhost:3000/health`
- Sync GitHub events: `curl -X POST http://localhost:3000/sync`
- Today score: `curl http://localhost:3000/score/today`
- Specific day: `curl http://localhost:3000/score/2024-09-20`
