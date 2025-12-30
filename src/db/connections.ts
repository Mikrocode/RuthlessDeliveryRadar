import { DB } from './index.js';

export type ConnectionProvider = 'jira' | 'gitlab';

export type ConnectionRecord = {
  provider: ConnectionProvider;
  access_token: string;
  refresh_token?: string | null;
  expires_at?: string | null;
  meta_json?: string | null;
  connected_at: string;
  updated_at: string;
};

export function getConnection(db: DB, provider: ConnectionProvider): ConnectionRecord | null {
  const row = db
    .prepare(
      `SELECT provider, access_token, refresh_token, expires_at, meta_json, connected_at, updated_at
       FROM connections WHERE provider = ?`,
    )
    .get(provider) as ConnectionRecord | undefined;

  return row ?? null;
}

export function upsertConnection(db: DB, record: ConnectionRecord): void {
  db.prepare(
    `INSERT INTO connections (provider, access_token, refresh_token, expires_at, meta_json, connected_at, updated_at)
     VALUES (@provider, @access_token, @refresh_token, @expires_at, @meta_json, @connected_at, @updated_at)
     ON CONFLICT(provider) DO UPDATE SET
       access_token=excluded.access_token,
       refresh_token=excluded.refresh_token,
       expires_at=excluded.expires_at,
       meta_json=excluded.meta_json,
       connected_at=excluded.connected_at,
       updated_at=excluded.updated_at`,
  ).run(record);
}

export function deleteConnection(db: DB, provider: ConnectionProvider): void {
  db.prepare('DELETE FROM connections WHERE provider = ?').run(provider);
}
