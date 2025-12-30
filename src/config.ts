import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

export type AppConfig = {
  githubToken?: string;
  githubOwner: string;
  githubRepo: string;
  databasePath: string;
  port: number;
};

export function loadConfig(): AppConfig {
  const githubOwner = process.env.GITHUB_OWNER;
  const githubRepo = process.env.GITHUB_REPO;

  if (!githubOwner || !githubRepo) {
    throw new Error('GITHUB_OWNER and GITHUB_REPO must be set.');
  }

  const databasePath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'rdr.sqlite');
  const port = Number(process.env.PORT || 3000);

  return {
    githubToken: process.env.GITHUB_TOKEN,
    githubOwner,
    githubRepo,
    databasePath,
    port,
  };
}
