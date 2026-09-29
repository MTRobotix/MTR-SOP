// Users and roles only — never SOP content (mtr-sop-content §1).
// Production: Postgres (Neon) via DATABASE_URL. Local: PGlite (Postgres in WASM) in .data/pglite.
import fs from "node:fs";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import type { Pool } from "pg";

type Driver = { query: <T>(sql: string, params?: unknown[]) => Promise<T[]> };

const g = globalThis as unknown as { __sopDb?: Promise<Driver> };

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
`;

async function connect(): Promise<Driver> {
  let driver: Driver;
  if (process.env.DATABASE_URL) {
    const { Pool: PgPool } = await import("pg");
    const pool: Pool = new PgPool({ connectionString: process.env.DATABASE_URL, max: 3 });
    driver = { query: async <T,>(sql: string, params: unknown[] = []) => (await pool.query(sql, params)).rows as T[] };
  } else {
    if (process.env.VERCEL) throw new Error("DATABASE_URL is required in deployment.");
    const { PGlite: Lite } = await import("@electric-sql/pglite");
    const dir = path.join(process.cwd(), ".data", "pglite");
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    const lite: PGlite = new Lite(dir);
    driver = { query: async <T,>(sql: string, params: unknown[] = []) => (await lite.query<T>(sql, params)).rows };
  }
  await driver.query(SCHEMA);
  return driver;
}

export function db(): Promise<Driver> {
  g.__sopDb ??= connect();
  return g.__sopDb;
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await db()).query<T>(sql, params);
}
