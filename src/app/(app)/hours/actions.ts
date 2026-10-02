"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { saveWeek, type SheetRow } from "@/lib/work/hours";

export type SaveResult = { rows?: SheetRow[]; error?: string };

export async function saveTimesheet(monday: string, rows: unknown): Promise<SaveResult> {
  const user = await requireUser();
  const res = await saveWeek(user.id, monday, rows);
  if (res.rows) revalidatePath("/", "layout");
  return res;
}
