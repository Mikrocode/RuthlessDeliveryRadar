import { DB } from '../db/index.js';
import { StoredRepoEvent } from '../types/index.js';

export type DailyRiskResult = {
  day: string;
  score: number;
  reasons: string[];
};

type ParsedEvent = {
  type: string;
  payload?: Record<string, unknown>;
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function parseEventPayload(event: StoredRepoEvent): ParsedEvent {
  try {
    const parsed = JSON.parse(event.raw_json);
    const raw = (parsed as { raw?: ParsedEvent }).raw ?? parsed;
    return {
      type: (raw as ParsedEvent).type,
      payload: (raw as ParsedEvent).payload,
    };
  } catch (error) {
    // If parsing fails, return minimal event info to avoid crashing scoring.
    return { type: event.type };
  }
}

export function computeRiskFromEvents(events: StoredRepoEvent[]): { score: number; reasons: string[] } {
  const parsedEvents = events.map(parseEventPayload);
  let score = 0;
  const reasons: string[] = [];

  const pushCount = parsedEvents.filter((e) => e.type === 'PushEvent').length;
  if (pushCount === 0) {
    score += 25;
    reasons.push('No PushEvent activity');
  }

  const issuesOpened = parsedEvents.filter((e) => e.type === 'IssuesEvent' && e.payload?.action === 'opened').length;
  if (issuesOpened > 10) {
    score += 10;
    reasons.push('High issue open volume');
  }

  const issuesClosed = parsedEvents.filter((e) => e.type === 'IssuesEvent' && e.payload?.action === 'closed').length;
  if (issuesClosed > 10) {
    score = Math.max(0, score - 10);
    reasons.push('Many issues closed');
  }

  const prOpened = parsedEvents.filter((e) => e.type === 'PullRequestEvent' && e.payload?.action === 'opened').length;
  if (prOpened > 20) {
    score += 10;
    reasons.push('High PR open volume');
  }

  const prReviews = parsedEvents.filter((e) => e.type === 'PullRequestReviewEvent').length;
  if (prReviews === 0) {
    score += 15;
    reasons.push('No PR reviews');
  }

  const prClosed = parsedEvents.filter((e) => e.type === 'PullRequestEvent' && e.payload?.action === 'closed').length;
  if (prClosed === 0) {
    score += 15;
    reasons.push('No closed pull requests');
  }

  return { score: clampScore(score), reasons };
}

export function getStoredDailyScore(db: DB, day: string): DailyRiskResult | null {
  const row = db
    .prepare('SELECT day, score, reasons_json FROM daily_scores WHERE day = ?')
    .get(day) as { day: string; score: number; reasons_json: string } | undefined;

  if (!row) return null;

  return {
    day: row.day,
    score: row.score,
    reasons: JSON.parse(row.reasons_json),
  };
}

export function computeAndStoreDailyRisk(db: DB, day: string): DailyRiskResult {
  const stored = getStoredDailyScore(db, day);
  if (stored) return stored;

  const events = db
    .prepare('SELECT * FROM repo_events WHERE date(created_at) = ?')
    .all(day) as StoredRepoEvent[];

  const { score, reasons } = computeRiskFromEvents(events);
  const computedAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO daily_scores(day, score, reasons_json, computed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET score=excluded.score, reasons_json=excluded.reasons_json, computed_at=excluded.computed_at`,
  ).run(day, score, JSON.stringify(reasons), computedAt);

  return { day, score, reasons };
}
