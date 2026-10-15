"use server";

import { redirect } from "next/navigation";
import { checkLogin } from "@/lib/auth/users";
import { client, isThrottled, recordLogin } from "@/lib/auth/logins";
import { startSession } from "@/lib/auth/session";

export type LoginState = { error?: string };

function safeNext(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : "";
  // Only same-site paths; blocks //evil.com and absolute URLs.
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/";
}

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter email and password." };
  const c = await client();
  if (await isThrottled(email, c.ip)) {
    await recordLogin(email, "throttled", c);
    return { error: "Too many attempts. Wait 15 minutes." };
  }
  const res = await checkLogin(email, password);
  if (!res.ok) {
    await recordLogin(email, res.reason, c, res.id);
    // Same message for every failure, so the form does not reveal which emails have accounts.
    return { error: "Wrong email or password." };
  }
  await recordLogin(email, "success", c, res.id);
  await startSession(res.id, res.sv);
  redirect(safeNext(form.get("next")));
}
