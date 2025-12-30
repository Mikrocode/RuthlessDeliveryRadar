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

## Connections UI (Jira and GitLab)
- Visit `http://localhost:3000/connections` to link Jira or GitLab.
- Configure environment variables for OAuth:
  - Jira: `JIRA_CLIENT_ID`, `JIRA_CLIENT_SECRET`, `JIRA_REDIRECT_URI` (e.g., `http://localhost:3000/auth/jira/callback`)
  - GitLab: `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`, `GITLAB_REDIRECT_URI` (e.g., `http://localhost:3000/auth/gitlab/callback`), `GITLAB_BASE_URL` (default `https://gitlab.com`)
- Jira app setup: create an OAuth integration in Atlassian developer console, add scopes `read:jira-work read:jira-user`, and set the redirect URL.
- GitLab app setup: create an application under your GitLab profile or group, enable `read_api` scope, and set the redirect URL.
