import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'app.db')

const dir = path.dirname(DB_PATH)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

declare global {
  // eslint-disable-next-line no-var
  var __db: DatabaseSync | undefined
}

function open(): DatabaseSync {
  const instance = new DatabaseSync(DB_PATH)
  instance.exec("PRAGMA busy_timeout = 5000")
  instance.exec("PRAGMA journal_mode = WAL")
  instance.exec("PRAGMA foreign_keys = ON")
  initSchema(instance)
  return instance
}

export const db: DatabaseSync = globalThis.__db ?? (globalThis.__db = open())

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db = db
}

function initSchema(d: DatabaseSync): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      google_id   TEXT UNIQUE NOT NULL,
      email       TEXT NOT NULL,
      full_name   TEXT NOT NULL,
      avatar_url  TEXT,
      role        TEXT NOT NULL DEFAULT 'user',
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      last_login  TEXT
    );

    CREATE TABLE IF NOT EXISTS presentations (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      theme       TEXT DEFAULT 'default',
      slides      TEXT NOT NULL DEFAULT '[]',
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_type         TEXT NOT NULL DEFAULT 'free',
      status            TEXT NOT NULL DEFAULT 'pending',
      start_date        TEXT,
      end_date          TEXT,
      payment_proof_url TEXT,
      expires_at        TEXT,
      created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message     TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'info',
      is_read     INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );

    CREATE TABLE IF NOT EXISTS ai_logs (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL,
      presentation_id TEXT,
      prompt          TEXT NOT NULL,
      client_prompt   TEXT,
      full_prompt     TEXT,
      response        TEXT,
      is_valid        INTEGER NOT NULL DEFAULT 0,
      tokens_used     INTEGER NOT NULL DEFAULT 0,
      cost_usd        REAL NOT NULL DEFAULT 0,
      duration_ms     INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `)
}
