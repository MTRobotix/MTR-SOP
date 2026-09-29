"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { isRole } from "@/lib/auth/roles";
import { createUser, setDisabled, setPassword, setRole, MIN_PASSWORD } from "@/lib/auth/users";

export type ActionState = { ok?: string; error?: string };

export async function addUser(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser("admin");
  const email = String(form.get("email") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const role = form.get("role");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (!name) return { error: "Enter a name." };
  if (password.length < MIN_PASSWORD) return { error: `Temporary password: at least ${MIN_PASSWORD} characters.` };
  if (!isRole(role)) return { error: "Pick a role." };
  try {
    await createUser(email, name, password, role);
  } catch {
    return { error: "A user with this email already exists." };
  }
  revalidatePath("/admin/users");
  return { ok: `Added ${email}. Send them the temporary password; they change it under Account.` };
}

export async function updateUser(form: FormData): Promise<void> {
  const me = await requireUser("admin");
  const id = Number(form.get("id"));
  const op = String(form.get("op"));
  if (!Number.isInteger(id)) return;
  // Admins cannot lock themselves out; own password changes go through /account.
  if (id === me.id) return;
  if (op === "role") {
    const role = form.get("role");
    if (isRole(role)) await setRole(id, role);
  } else if (op === "disable") await setDisabled(id, true);
  else if (op === "enable") await setDisabled(id, false);
  else if (op === "password") {
    const pw = String(form.get("password") ?? "");
    if (pw.length >= MIN_PASSWORD) await setPassword(id, pw);
  }
  revalidatePath("/admin/users");
}
