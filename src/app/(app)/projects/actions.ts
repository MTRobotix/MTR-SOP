"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import type { User } from "@/lib/auth/roles";
import {
  addMember,
  canManage,
  createProject,
  deleteProject,
  getProject,
  isMember,
  listActivePeople,
  projectNameTaken,
  removeMember,
  updateProject,
  updateProjectAsLead,
  type Project,
  type ProjectInput,
} from "@/lib/work/projects";
import { createTask, deleteTask, getTask, setTaskStatus, updateTask, type TaskInput } from "@/lib/work/tasks";
import { cleanName, isIsoDate, isProjectStatus, isTaskStatus } from "@/lib/work/shared";

export type FormState = { error?: string; ok?: string };

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const id = (form: FormData, key: string) => {
  const n = Number(form.get(key));
  return Number.isInteger(n) && n > 0 ? n : null;
};

/** Empty → null. Invalid → undefined, so the caller can say which field is wrong. */
function optionalDate(form: FormData, key: string): string | null | undefined {
  const v = text(form, key);
  if (!v) return null;
  return isIsoDate(v) ? v : undefined;
}

/** The project, if this user may manage it (admin, or its lead). Redirects otherwise. */
async function managed(form: FormData): Promise<{ user: User; project: Project }> {
  const user = await requireUser();
  const project = await getProject(id(form, "projectId") ?? 0);
  if (!project) redirect("/projects");
  if (!canManage(user, project)) redirect("/forbidden");
  return { user, project };
}

function refresh(projectId?: number) {
  revalidatePath("/", "layout");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

// ── Projects ────────────────────────────────────────────────────────────────

async function readProject(form: FormData): Promise<ProjectInput | string> {
  const name = cleanName(text(form, "name"));
  const customer = cleanName(text(form, "customer"));
  const description = text(form, "description");
  const status = form.get("status");
  const leadId = id(form, "leadId");
  const budgetRaw = text(form, "budgetHours").replace(",", ".");
  const startDate = optionalDate(form, "startDate");
  const dueDate = optionalDate(form, "dueDate");
  if (!name) return "Enter a project name.";
  if (name.length > 80) return "Project name: at most 80 characters.";
  if (customer.length > 80) return "Customer: at most 80 characters.";
  if (description.length > 2000) return "Description: at most 2000 characters.";
  if (!isProjectStatus(status)) return "Pick a status.";
  if (startDate === undefined) return "Start date is not a date.";
  if (dueDate === undefined) return "Due date is not a date.";
  if (startDate && dueDate && dueDate < startDate) return "The due date is before the start date.";
  let budgetHours: number | null = null;
  if (budgetRaw) {
    budgetHours = Number(budgetRaw);
    if (!/^\d+(\.\d{1,2})?$/.test(budgetRaw) || budgetHours <= 0 || budgetHours > 100000) return "Hour budget: a number of hours above 0, or leave it empty.";
  }
  if (leadId !== null && !(await listActivePeople()).some((p) => p.id === leadId)) return "Pick a lead from the list.";
  return { name, customer, description, status, leadId, budgetHours, startDate, dueDate };
}

export async function createProjectAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireUser("admin");
  const p = await readProject(form);
  if (typeof p === "string") return { error: p };
  const taken = await projectNameTaken(p.name);
  if (taken) return { error: `A project named ${taken} exists. Pick another name.` };
  const newId = await createProject(p);
  refresh();
  redirect(`/projects/${newId}`);
}

export async function updateProjectAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { user, project } = await managed(form);
  if (user.role === "admin") {
    const p = await readProject(form);
    if (typeof p === "string") return { error: p };
    const taken = await projectNameTaken(p.name, project.id);
    if (taken) return { error: `A project named ${taken} exists. Pick another name.` };
    await updateProject(project.id, p);
  } else {
    // Leads change what the work needs, not the name, customer, lead or budget the admin set.
    const p = await readProject(withAdminFields(form, project));
    if (typeof p === "string") return { error: p };
    await updateProjectAsLead(project.id, p);
  }
  refresh(project.id);
  redirect(`/projects/${project.id}`);
}

/** Fills the fields a lead cannot change with the stored values, so one validator covers both forms. */
function withAdminFields(form: FormData, p: Project): FormData {
  const f = new FormData();
  for (const [k, v] of form) f.append(k, v);
  f.set("name", p.name);
  f.set("customer", p.customer);
  f.set("leadId", p.leadId ? String(p.leadId) : "");
  f.set("budgetHours", p.budgetHours ? String(p.budgetHours) : "");
  return f;
}

export async function deleteProjectAction(form: FormData): Promise<void> {
  await requireUser("admin");
  const projectId = id(form, "projectId");
  if (!projectId) redirect("/projects");
  const res = await deleteProject(projectId);
  if (res.error) redirect(`/projects/${projectId}/edit?error=${encodeURIComponent(res.error)}`);
  refresh();
  redirect("/projects");
}

// ── Contributors ────────────────────────────────────────────────────────────

export async function addMemberAction(form: FormData): Promise<void> {
  const { project } = await managed(form);
  const userId = id(form, "userId");
  if (userId) await addMember(project.id, userId);
  refresh(project.id);
}

export async function removeMemberAction(form: FormData): Promise<void> {
  const { project } = await managed(form);
  const userId = id(form, "userId");
  if (userId) await removeMember(project.id, userId);
  refresh(project.id);
}

// ── Tasks ───────────────────────────────────────────────────────────────────

async function readTask(form: FormData, projectId: number): Promise<TaskInput | string> {
  const title = cleanName(text(form, "title"));
  const notes = text(form, "notes");
  const status = form.get("status") ?? "todo";
  const assigneeId = id(form, "assigneeId");
  const dueDate = optionalDate(form, "dueDate");
  if (!title) return "Enter what needs doing.";
  if (title.length > 120) return "Task: at most 120 characters.";
  if (notes.length > 2000) return "Notes: at most 2000 characters.";
  if (!isTaskStatus(status)) return "Pick a status.";
  if (dueDate === undefined) return "Due date is not a date.";
  if (assigneeId !== null && !(await isMember(projectId, assigneeId))) return "Assign the task to a contributor of this project.";
  return { title, notes, status, assigneeId, dueDate };
}

export async function addTaskAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { user, project } = await managed(form);
  const t = await readTask(form, project.id);
  if (typeof t === "string") return { error: t };
  await createTask(project.id, t, user.id);
  refresh(project.id);
  return { ok: `Added “${t.title}”.` };
}

export async function updateTaskAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { project } = await managed(form);
  const task = await getTask(id(form, "taskId") ?? 0);
  if (!task || task.projectId !== project.id) redirect(`/projects/${project.id}`);
  const t = await readTask(form, project.id);
  if (typeof t === "string") return { error: t };
  await updateTask(task.id, t);
  refresh(project.id);
  return { ok: "Saved." };
}

/** Managers move any task; a contributor moves the tasks assigned to them. */
export async function setTaskStatusAction(form: FormData): Promise<void> {
  const user = await requireUser();
  const task = await getTask(id(form, "taskId") ?? 0);
  const status = form.get("status");
  if (!task || !isTaskStatus(status)) return;
  const project = await getProject(task.projectId);
  if (!project || !(canManage(user, project) || task.assigneeId === user.id)) redirect("/forbidden");
  await setTaskStatus(task.id, status);
  refresh(project.id);
}

export async function deleteTaskAction(form: FormData): Promise<void> {
  const { project } = await managed(form);
  const task = await getTask(id(form, "taskId") ?? 0);
  if (task && task.projectId === project.id) await deleteTask(task.id);
  refresh(project.id);
  redirect(`/projects/${project.id}`);
}
