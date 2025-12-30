import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

export type AppConfig = {
  githubToken?: string;
  githubOwner: string;
  githubRepo: string;
  databasePath: string;
  port: number;
  jiraClientId?: string;
  jiraClientSecret?: string;
  jiraRedirectUri?: string;
  gitlabClientId?: string;
  gitlabClientSecret?: string;
  gitlabRedirectUri?: string;
  gitlabBaseUrl: string;
};

export function loadConfig(): AppConfig {
  const githubOwner = process.env.GITHUB_OWNER;
  const githubRepo = process.env.GITHUB_REPO;

  if (!githubOwner || !githubRepo) {
    throw new Error('GITHUB_OWNER and GITHUB_REPO must be set.');
  }

  const databasePath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'rdr.sqlite');
  const port = Number(process.env.PORT || 3000);
  const gitlabBaseUrl = process.env.GITLAB_BASE_URL || 'https://gitlab.com';

  return {
    githubToken: process.env.GITHUB_TOKEN,
    githubOwner,
    githubRepo,
    databasePath,
    port,
    jiraClientId: process.env.JIRA_CLIENT_ID,
    jiraClientSecret: process.env.JIRA_CLIENT_SECRET,
    jiraRedirectUri: process.env.JIRA_REDIRECT_URI,
    gitlabClientId: process.env.GITLAB_CLIENT_ID,
    gitlabClientSecret: process.env.GITLAB_CLIENT_SECRET,
    gitlabRedirectUri: process.env.GITLAB_REDIRECT_URI,
    gitlabBaseUrl,
  };
}
