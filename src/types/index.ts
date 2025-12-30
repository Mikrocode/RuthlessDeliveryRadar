export type GitHubEvent = {
  id?: string;
  type: string;
  actor?: { login?: string };
  created_at: string;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
};

export type StoredRepoEvent = {
  id?: number;
  type: string;
  actor: string;
  created_at: string;
  raw_json: string;
  inserted_at: string;
};

export type DailyScore = {
  id?: number;
  day: string;
  score: number;
  reasons_json: string;
  computed_at: string;
};

export type ConnectionMeta = {
  cloudId?: string;
  siteName?: string;
  gitlabUserId?: number;
  gitlabUsername?: string;
};
