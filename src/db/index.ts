import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { runMigrations } from './migrations.js';

export type DB = Database.Database;

export function initDatabase(databasePath: string): DB {
  const dir = path.dirname(databasePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(databasePath);
  runMigrations(db);
  return db;
}
