"use server";

import { redirect } from "next/navigation";
import { checkLogin, isThrottled, recordFailure } from "@/lib/auth/users";
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
  if (isThrottled(email)) return { error: "Too many attempts. Wait 15 minutes." };
  const ok = await checkLogin(email, password);
  if (!ok) {
    recordFailure(email);
    return { error: "Wrong email or password." };
  }
  await startSession(ok.id, ok.sv);
  redirect(safeNext(form.get("next")));
}
