"use server";

import { requireUser, startSession } from "@/lib/auth/session";
import { MIN_PASSWORD, setPassword, verifyPassword } from "@/lib/auth/users";

export type PwState = { ok?: string; error?: string };

export async function changePassword(_prev: PwState, form: FormData): Promise<PwState> {
  const user = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (!(await verifyPassword(user.id, current))) return { error: "Current password is wrong." };
  if (next.length < MIN_PASSWORD) return { error: `New password: at least ${MIN_PASSWORD} characters.` };
  if (next !== String(form.get("confirm") ?? "")) return { error: "New passwords do not match." };
  const sv = await setPassword(user.id, next);
  // Other sessions are signed out; keep this one.
  await startSession(user.id, sv);
  return { ok: "Password changed. Other devices are signed out." };
}
