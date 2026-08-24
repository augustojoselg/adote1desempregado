import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'adote.db');

import fs from 'fs';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Mentor','Profissional','Empresa')),
  bio TEXT DEFAULT '',
  city TEXT DEFAULT '',
  linkedin TEXT DEFAULT '',
  token_hash TEXT NOT NULL,
  consent_given INTEGER NOT NULL DEFAULT 0,
  consent_at TEXT,
  privacy_policy_version TEXT,
  anonymized_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS elos (
  id TEXT PRIMARY KEY,
  mentor_id TEXT NOT NULL,
  professional_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Combinado' CHECK(status IN ('Combinado','Em contato','Entrevistas','Recolocado')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mentor_id) REFERENCES users(id),
  FOREIGN KEY (professional_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT DEFAULT '',
  link TEXT NOT NULL,
  posted_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (posted_by) REFERENCES users(id)
);

-- Append-only log so we can PROVE consent was given/revoked if ever challenged (LGPD Art. 8 paragraph 2)
CREATE TABLE IF NOT EXISTS consent_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('given','revoked','export_requested','deletion_requested')),
  policy_version TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_elos_mentor ON elos(mentor_id);
CREATE INDEX IF NOT EXISTS idx_elos_professional ON elos(professional_id);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);
`);

export default db;
