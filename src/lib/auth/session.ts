import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { query } from "../db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./token";
import { hasRole, type Role, type User } from "./roles";

type UserRow = { id: number; email: string; name: string; role: Role; disabled: boolean; session_version: number };

/** Current user, re-checked against the DB on every request so role changes and disables apply at once. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const claims = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  const [row] = await query<UserRow>(
    "SELECT id, email, name, role, disabled, session_version FROM users WHERE id = $1",
    [claims.uid],
  );
  if (!row || row.disabled || row.session_version !== claims.sv) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
});

export async function requireUser(min: Role = "viewer"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user.role, min)) redirect("/forbidden");
  return user;
}

export async function startSession(uid: number, sv: number): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, await signSession({ uid, sv }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
