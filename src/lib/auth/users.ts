import bcrypt from "bcryptjs";
import { query } from "../db";
import type { Role } from "./roles";

export { MIN_PASSWORD } from "./roles";

export type UserListRow = { id: number; email: string; name: string; role: Role; disabled: boolean; created_at: string };

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createUser(email: string, name: string, password: string, role: Role): Promise<void> {
  const hash = await bcrypt.hash(password, 12);
  await query("INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)", [normalizeEmail(email), name.trim(), hash, role]);
}

let dummyHash: Promise<string> | undefined;

export async function checkLogin(email: string, password: string): Promise<{ id: number; sv: number } | null> {
  const [row] = await query<{ id: number; password_hash: string; disabled: boolean; session_version: number }>(
    "SELECT id, password_hash, disabled, session_version FROM users WHERE email = $1",
    [normalizeEmail(email)],
  );
  // Compare against a dummy hash when the user is missing so timing does not reveal which emails exist.
  dummyHash ??= bcrypt.hash("not-a-real-password", 12);
  const ok = await bcrypt.compare(password, row?.password_hash ?? (await dummyHash));
  if (!row || !ok || row.disabled) return null;
  return { id: row.id, sv: row.session_version };
}

export async function listUsers(): Promise<UserListRow[]> {
  return query<UserListRow>("SELECT id, email, name, role, disabled, created_at::text FROM users ORDER BY email");
}

export async function setRole(id: number, role: Role): Promise<void> {
  await query("UPDATE users SET role = $2 WHERE id = $1", [id, role]);
}

/** Disabling also bumps session_version, which signs the user out everywhere. */
export async function setDisabled(id: number, disabled: boolean): Promise<void> {
  await query("UPDATE users SET disabled = $2, session_version = session_version + 1 WHERE id = $1", [id, disabled]);
}

/** Changing a password signs out every existing session of that user. Returns the new session version. */
export async function setPassword(id: number, password: string): Promise<number> {
  const hash = await bcrypt.hash(password, 12);
  const [row] = await query<{ session_version: number }>(
    "UPDATE users SET password_hash = $2, session_version = session_version + 1 WHERE id = $1 RETURNING session_version",
    [id, hash],
  );
  return row.session_version;
}

export async function verifyPassword(id: number, password: string): Promise<boolean> {
  const [row] = await query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [id]);
  return !!row && (await bcrypt.compare(password, row.password_hash));
}

// Simple per-process login throttle: 5 failures per email per 15 minutes.
const failures = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;

export function isThrottled(email: string): boolean {
  const now = Date.now();
  const list = (failures.get(normalizeEmail(email)) ?? []).filter((t) => now - t < WINDOW_MS);
  failures.set(normalizeEmail(email), list);
  return list.length >= 5;
}

export function recordFailure(email: string): void {
  const key = normalizeEmail(email);
  failures.set(key, [...(failures.get(key) ?? []), Date.now()]);
}
