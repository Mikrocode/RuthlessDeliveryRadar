import { describe, expect, it } from 'vitest';
import { computeRiskFromEvents } from '../src/scoring/risk.js';
import { StoredRepoEvent } from '../src/types/index.js';

function makeEvent(type: string, payload: Record<string, unknown> = {}, createdAt = '2024-01-01T00:00:00Z'): StoredRepoEvent {
  return {
    type,
    actor: 'tester',
    created_at: createdAt,
    raw_json: JSON.stringify({ type, payload }),
    inserted_at: createdAt,
  };
}

describe('computeRiskFromEvents', () => {
  it('assigns baseline risk when there is no activity', () => {
    const result = computeRiskFromEvents([]);
    expect(result.score).toBe(55);
    expect(result.reasons).toEqual([
      'No PushEvent activity',
      'No PR reviews',
      'No closed pull requests',
    ]);
  });

  it('adds risk for active issue and PR opening without reviews', () => {
    const events: StoredRepoEvent[] = [
      ...Array.from({ length: 11 }, (_, i) => makeEvent('IssuesEvent', { action: 'opened', number: i })),
      ...Array.from({ length: 21 }, (_, i) => makeEvent('PullRequestEvent', { action: 'opened', number: i })),
    ];

    const result = computeRiskFromEvents(events);
    expect(result.score).toBe(50);
    expect(result.reasons).toEqual([
      'High issue open volume',
      'High PR open volume',
      'No PR reviews',
      'No closed pull requests',
    ]);
  });

  it('reduces risk when many issues are closed', () => {
    const events: StoredRepoEvent[] = [
      makeEvent('PushEvent'),
      ...Array.from({ length: 12 }, (_, i) => makeEvent('IssuesEvent', { action: 'closed', number: i })),
      makeEvent('PullRequestReviewEvent'),
      makeEvent('PullRequestEvent', { action: 'closed' }),
    ];

    const result = computeRiskFromEvents(events);
    expect(result.score).toBe(0);
    expect(result.reasons).toEqual(['Many issues closed']);
  });
});
