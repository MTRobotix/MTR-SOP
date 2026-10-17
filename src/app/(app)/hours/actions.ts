"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { deleteEntry, logTime, updateEntry } from "@/lib/work/hours";
import { parseHours } from "@/lib/work/shared";
import { today } from "@/lib/work/today";

export type LogState = { ok?: string; error?: string; at?: number };

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/** Project pages, the dashboard and the home cards all show logged hours. */
function refresh() {
  revalidatePath("/", "layout");
}

export async function logTimeAction(_prev: LogState, form: FormData): Promise<LogState> {
  const user = await requireUser();
  const projectId = Number(form.get("projectId"));
  const hours = parseHours(text(form, "hours"));
  if (!Number.isInteger(projectId) || projectId <= 0) return { error: "Pick a project." };
  if (!hours) return { error: "Enter the hours, like 2, 1.5 or 1:30." };
  const res = await logTime(user.id, { projectId, date: text(form, "date"), hours, note: text(form, "note") }, await today());
  if (res.ok) refresh();
  return { ...res, at: Date.now() };
}

export async function updateEntryAction(_prev: LogState, form: FormData): Promise<LogState> {
  const user = await requireUser();
  const hours = parseHours(text(form, "hours"));
  if (!hours) return { error: "Enter the hours, like 2, 1.5 or 1:30. To remove the entry, delete it." };
  const res = await updateEntry(user.id, Number(form.get("rowId")), text(form, "date"), hours, text(form, "note"));
  if (res.ok) refresh();
  return { ...res, at: Date.now() };
}

export async function deleteEntryAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const res = await deleteEntry(user.id, Number(form.get("rowId")), text(form, "date"));
  if (res.ok) refresh();
}
