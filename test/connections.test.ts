import { describe, expect, it } from 'vitest';
import { initDatabase } from '../src/db/index.js';
import { deleteConnection, getConnection, upsertConnection } from '../src/db/connections.js';

describe('connections repository', () => {
  it('stores, retrieves, and deletes a connection', () => {
    const db = initDatabase(':memory:');
    const now = new Date().toISOString();

    upsertConnection(db, {
      provider: 'jira',
      access_token: 'token-123',
      refresh_token: 'refresh-123',
      expires_at: now,
      meta_json: JSON.stringify({ siteName: 'Test' }),
      connected_at: now,
      updated_at: now,
    });

    const found = getConnection(db, 'jira');
    expect(found).not.toBeNull();
    expect(found?.access_token).toBe('token-123');

    deleteConnection(db, 'jira');
    const afterDelete = getConnection(db, 'jira');
    expect(afterDelete).toBeNull();
  });
});
