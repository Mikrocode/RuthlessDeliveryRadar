import Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  db.exec('PRAGMA journal_mode = WAL;');

  const migrations = [
    `CREATE TABLE IF NOT EXISTS repo_events (
        id INTEGER PRIMARY KEY,
        type TEXT NOT NULL,
        actor TEXT NOT NULL,
        created_at TEXT NOT NULL,
        raw_json TEXT NOT NULL,
        inserted_at TEXT NOT NULL
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_repo_events_unique ON repo_events(type, actor, created_at, raw_json);`,
    `CREATE TABLE IF NOT EXISTS daily_scores (
        id INTEGER PRIMARY KEY,
        day TEXT UNIQUE NOT NULL,
        score INTEGER NOT NULL,
        reasons_json TEXT NOT NULL,
        computed_at TEXT NOT NULL
    );`,
  ];

  for (const sql of migrations) {
    db.exec(sql);
  }
}
