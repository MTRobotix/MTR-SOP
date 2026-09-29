"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { store, ConflictError } from "@/lib/store";

export async function decide(form: FormData): Promise<void> {
  const user = await requireUser("admin");
  const id = String(form.get("id") ?? "");
  const op = String(form.get("op") ?? "");
  let msg = "";
  try {
    if (op === "approve") {
      await store().approve(id, user);
      msg = store().mode === "github" ? "Approved and merged. Live after the site redeploys (~1–2 min)." : "Approved. File written to content/.";
    } else if (op === "reject") {
      await store().reject(id, user);
      msg = "Rejected.";
    }
  } catch (e) {
    if (!(e instanceof ConflictError)) throw e;
    redirect(`/admin/reviews/${encodeURIComponent(id)}?error=${encodeURIComponent(e.message)}`);
  }
  redirect(`/admin/reviews?done=${encodeURIComponent(msg)}`);
}
