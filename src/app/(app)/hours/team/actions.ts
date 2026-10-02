"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { promoteCustom } from "@/lib/work/hours";

export async function promote(form: FormData): Promise<void> {
  await requireUser("admin");
  const name = String(form.get("name") ?? "");
  const target = String(form.get("target") ?? "");
  const back = String(form.get("back") ?? "");
  const id = Number(target);
  if (!name || (target !== "new" && !Number.isInteger(id))) redirect(`/hours/team?${back}`);
  const res = await promoteCustom(name, target === "new" ? "new" : id);
  revalidatePath("/", "layout");
  if (res.error) redirect(`/hours/team?${back}&error=${encodeURIComponent(res.error)}`);
  if (target === "new") redirect(`/projects/${res.projectId}/edit?created=1`);
  redirect(`/hours/team?${back}&done=${encodeURIComponent(`Moved “${name}” to the project.`)}`);
}
