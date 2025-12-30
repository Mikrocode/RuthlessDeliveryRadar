import { createHash } from 'node:crypto';
import { AppConfig } from '../config.js';
import { DB } from '../db/index.js';
import { StoredRepoEvent } from '../types/index.js';
import { fetchRepoEvents } from './client.js';

export async function syncRepoEvents(db: DB, config: AppConfig): Promise<{ fetched: number; inserted: number }> {
  const events = await fetchRepoEvents(config);
  const insert = db.prepare(
    'INSERT OR IGNORE INTO repo_events (type, actor, created_at, raw_json, inserted_at) VALUES (?, ?, ?, ?, ?)',
  );

  let inserted = 0;
  for (const event of events) {
    const rawJson = JSON.stringify(event);
    const actor = event.actor?.login ?? 'unknown';
    const createdAt = event.created_at;
    const hash = createHash('sha256').update(rawJson).digest('hex');
    const uniqueRaw = JSON.stringify({ raw: event, hash });
    const result = insert.run(event.type, actor, createdAt, uniqueRaw, new Date().toISOString());
    inserted += result.changes;
  }

  return { fetched: events.length, inserted };
}
