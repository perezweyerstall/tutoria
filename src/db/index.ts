import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const BOOTSTRAP_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  source_format TEXT NOT NULL,
  source_filename TEXT,
  raw_content TEXT NOT NULL,
  summary TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_units (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  body TEXT NOT NULL,
  key_formula TEXT,
  interactive_config_json TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL DEFAULT 5,
  completed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS study_plan_steps (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES learning_units(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  step_type TEXT NOT NULL,
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  target_minutes INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS candidate_items (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES learning_units(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL,
  topic TEXT NOT NULL,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  options_json TEXT NOT NULL DEFAULT '[]',
  explanation TEXT NOT NULL,
  generator_source TEXT NOT NULL DEFAULT 'local-deterministic',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES learning_units(id) ON DELETE SET NULL,
  candidate_id TEXT REFERENCES candidate_items(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  explanation TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'new',
  due_at TEXT NOT NULL,
  interval_days REAL NOT NULL DEFAULT 0,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  repetitions INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_logs (
  id TEXT PRIMARY KEY NOT NULL,
  flashcard_id TEXT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_interval_days REAL NOT NULL,
  next_interval_days REAL NOT NULL,
  previous_ease_factor REAL NOT NULL,
  next_ease_factor REAL NOT NULL,
  reviewed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES learning_units(id) ON DELETE SET NULL,
  candidate_id TEXT REFERENCES candidate_items(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  times_answered INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  last_answered_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  question_id TEXT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  submitted_answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  attempted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  metric TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  period TEXT NOT NULL DEFAULT 'weekly',
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  duration_minutes REAL NOT NULL,
  items_completed INTEGER NOT NULL DEFAULT 0,
  reflection TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  unit_id TEXT REFERENCES learning_units(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS language_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  unit_id TEXT REFERENCES learning_units(id) ON DELETE SET NULL,
  phrase TEXT NOT NULL,
  language_label TEXT NOT NULL,
  capture_mode TEXT NOT NULL,
  target_duration_sec REAL NOT NULL,
  recorded_duration_sec REAL NOT NULL,
  active_speech_sec REAL NOT NULL,
  pause_ratio REAL NOT NULL,
  words_per_minute REAL NOT NULL,
  pacing_ratio REAL NOT NULL,
  recognized_transcript TEXT,
  pronunciation_overlap REAL,
  feedback_summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_units_lesson ON learning_units(lesson_id, order_index);
CREATE INDEX IF NOT EXISTS idx_candidate_items_status ON candidate_items(status, lesson_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(due_at);
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed_at ON review_logs(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started_at ON study_sessions(started_at);
`;

let activeSqlite: Database.Database | null = null;
let activeDrizzle: BetterSQLite3Database<typeof schema> | null = null;
let activeDbPath: string | null = null;

export function getResolvedDatabasePath(): string {
  if (process.env.DATABASE_URL?.trim()) {
    const configured = process.env.DATABASE_URL.trim();
    if (configured === ':memory:') {
      return ':memory:';
    }
    const cleanPath = configured.startsWith('file:') ? configured.slice(5) : configured;
    return path.resolve(process.cwd(), cleanPath);
  }
  if (process.env.VERCEL) {
    return '/tmp/tutoria.db';
  }
  const configured = fs.existsSync(path.resolve(process.cwd(), './data/principia.db'))
    ? './data/principia.db'
    : './data/tutoria.db';
  return path.resolve(process.cwd(), configured);
}

export function getResolvedBackupDir(): string {
  if (process.env.BACKUP_DIR?.trim()) {
    return path.resolve(process.cwd(), process.env.BACKUP_DIR.trim());
  }
  if (process.env.VERCEL) {
    return '/tmp/backups';
  }
  const configured = process.env.BACKUP_DIR?.trim() || './data/backups';
  return path.resolve(process.cwd(), configured);
}

export function initializeSqliteInstance(sqlite: Database.Database): void {
  sqlite.pragma('foreign_keys = ON');
  try {
    sqlite.pragma('journal_mode = WAL');
  } catch {
    // In-memory SQLite returns 'memory' journal_mode, which is safe
  }
  sqlite.exec(BOOTSTRAP_SQL);
}

export function getDb(): {
  db: BetterSQLite3Database<typeof schema>;
  sqlite: Database.Database;
  dbPath: string;
} {
  const resolvedPath = getResolvedDatabasePath();

  if (activeDrizzle && activeSqlite && activeDbPath === resolvedPath && activeSqlite.open) {
    return { db: activeDrizzle, sqlite: activeSqlite, dbPath: resolvedPath };
  }

  if (activeSqlite && activeSqlite.open) {
    activeSqlite.close();
  }

  if (resolvedPath !== ':memory:') {
    try {
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    } catch {
      // Safe if directory exists or in read-only environments
    }
  }

  const sqlite = new Database(resolvedPath);
  initializeSqliteInstance(sqlite);
  const db = drizzle(sqlite, { schema });

  activeSqlite = sqlite;
  activeDrizzle = db;
  activeDbPath = resolvedPath;

  return { db, sqlite, dbPath: resolvedPath };
}

export function closeDbConnection(): void {
  if (activeSqlite && activeSqlite.open) {
    activeSqlite.close();
  }
  activeSqlite = null;
  activeDrizzle = null;
  activeDbPath = null;
}

export { schema };
