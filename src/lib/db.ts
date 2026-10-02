// Users, projects, tasks and hours — never SOP content (mtr-sop-content §1).
// Production: Postgres (Neon) via DATABASE_URL. Local: PGlite (Postgres in WASM) in .data/pglite.
import fs from "node:fs";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import type { Pool } from "pg";

export type Tx = { query: <T>(sql: string, params?: unknown[]) => Promise<T[]> };
type Driver = Tx & { exec: (sql: string) => Promise<void>; transaction: <R>(fn: (tx: Tx) => Promise<R>) => Promise<R> };

const g = globalThis as unknown as { __homeDb?: Promise<Driver> };

// Every statement is idempotent: it runs on each cold start and adds whatever an older database lacks.
// Read NUMERIC as ::float8, COUNT as ::int and DATE as ::text in queries: drivers return strings or Date otherwise.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  disabled BOOLEAN NOT NULL DEFAULT FALSE,
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  customer TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'done')),
  lead_id INTEGER REFERENCES users(id),
  budget_hours NUMERIC(8, 2) CHECK (budget_hours > 0),
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS projects_name_key ON projects (lower(name));

CREATE TABLE IF NOT EXISTS project_members (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  assignee_id INTEGER REFERENCES users(id),
  due_date DATE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks (project_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks (assignee_id);

-- One timesheet row = one person, one week, one project (or one free-text name). Hours per day hang off it.
CREATE TABLE IF NOT EXISTS timesheet_rows (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  week_start DATE NOT NULL CHECK (EXTRACT(ISODOW FROM week_start) = 1),
  project_id INTEGER REFERENCES projects(id),
  custom_name TEXT,
  note TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  CHECK ((project_id IS NULL) <> (custom_name IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS timesheet_rows_project_key ON timesheet_rows (user_id, week_start, project_id) WHERE project_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS timesheet_rows_custom_key ON timesheet_rows (user_id, week_start, lower(custom_name)) WHERE custom_name IS NOT NULL;

CREATE TABLE IF NOT EXISTS time_entries (
  row_id INTEGER NOT NULL REFERENCES timesheet_rows(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  hours NUMERIC(5, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  PRIMARY KEY (row_id, work_date)
);
CREATE INDEX IF NOT EXISTS time_entries_date_idx ON time_entries (work_date);
`;

async function connect(): Promise<Driver> {
  let driver: Driver;
  if (process.env.DATABASE_URL) {
    const { Pool: PgPool } = await import("pg");
    const pool: Pool = new PgPool({ connectionString: process.env.DATABASE_URL, max: 3 });
    driver = {
      query: async <T,>(sql: string, params: unknown[] = []) => (await pool.query(sql, params)).rows as T[],
      exec: async (sql) => void (await pool.query(sql)),
      transaction: async (fn) => {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const out = await fn({ query: async <T,>(sql: string, params: unknown[] = []) => (await client.query(sql, params)).rows as T[] });
          await client.query("COMMIT");
          return out;
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      },
    };
  } else {
    if (process.env.VERCEL) throw new Error("DATABASE_URL is required in deployment.");
    const { PGlite: Lite } = await import("@electric-sql/pglite");
    const dir = path.join(process.cwd(), ".data", "pglite");
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    const lite: PGlite = new Lite(dir);
    driver = {
      query: async <T,>(sql: string, params: unknown[] = []) => (await lite.query<T>(sql, params)).rows,
      exec: async (sql) => void (await lite.exec(sql)),
      transaction: (fn) => lite.transaction((tx) => fn({ query: async <T,>(sql: string, params: unknown[] = []) => (await tx.query<T>(sql, params)).rows })),
    };
  }
  await driver.exec(SCHEMA);
  return driver;
}

export function db(): Promise<Driver> {
  g.__homeDb ??= connect();
  return g.__homeDb;
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await db()).query<T>(sql, params);
}

/** Runs fn in one transaction: all of its queries commit together or none do. */
export async function transaction<R>(fn: (tx: Tx) => Promise<R>): Promise<R> {
  return (await db()).transaction(fn);
}
