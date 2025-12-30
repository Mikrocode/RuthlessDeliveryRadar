import { AppConfig } from '../config.js';
import { GitHubEvent } from '../types/index.js';

export async function fetchRepoEvents(config: AppConfig): Promise<GitHubEvent[]> {
  const url = `https://api.github.com/repos/${config.githubOwner}/${config.githubRepo}/events`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ruthless-delivery-radar',
  };

  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${message}`);
  }

  const data = (await response.json()) as GitHubEvent[];
  return data;
}
