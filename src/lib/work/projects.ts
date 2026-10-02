import "server-only";
import { query, transaction } from "../db";
import type { User } from "../auth/roles";
import type { ProjectStatus } from "./shared";

export type Person = { id: number; name: string };

export type Project = {
  id: number;
  name: string;
  customer: string;
  description: string;
  status: ProjectStatus;
  leadId: number | null;
  leadName: string | null;
  budgetHours: number | null;
  startDate: string | null;
  dueDate: string | null;
  /** Hours logged on timesheets, all time. */
  hours: number;
  openTasks: number;
  doneTasks: number;
  /** Contributors, lead included. */
  members: Person[];
};

export type ProjectInput = {
  name: string;
  customer: string;
  description: string;
  status: ProjectStatus;
  leadId: number | null;
  budgetHours: number | null;
  startDate: string | null;
  dueDate: string | null;
};

type Row = {
  id: number;
  name: string;
  customer: string;
  description: string;
  status: ProjectStatus;
  lead_id: number | null;
  lead_name: string | null;
  budget_hours: number | null;
  start_date: string | null;
  due_date: string | null;
  hours: number;
  open_tasks: number;
  done_tasks: number;
};

const SELECT = `
SELECT p.id, p.name, p.customer, p.description, p.status, p.lead_id, l.name AS lead_name,
  p.budget_hours::float8 AS budget_hours, p.start_date::text AS start_date, p.due_date::text AS due_date,
  COALESCE(h.hours, 0)::float8 AS hours, COALESCE(t.open, 0)::int AS open_tasks, COALESCE(t.done, 0)::int AS done_tasks
FROM projects p
LEFT JOIN users l ON l.id = p.lead_id
LEFT JOIN (
  SELECT r.project_id, SUM(e.hours) AS hours
  FROM timesheet_rows r JOIN time_entries e ON e.row_id = r.id
  WHERE r.project_id IS NOT NULL GROUP BY r.project_id
) h ON h.project_id = p.id
LEFT JOIN (
  SELECT project_id, COUNT(*) FILTER (WHERE status <> 'done') AS open, COUNT(*) FILTER (WHERE status = 'done') AS done
  FROM tasks GROUP BY project_id
) t ON t.project_id = p.id`;

const ORDER = `ORDER BY CASE p.status WHEN 'active' THEN 0 WHEN 'planning' THEN 1 WHEN 'on_hold' THEN 2 ELSE 3 END,
  p.due_date NULLS LAST, lower(p.name)`;

async function membersOf(ids: number[]): Promise<Map<number, Person[]>> {
  const out = new Map<number, Person[]>(ids.map((id) => [id, []]));
  if (!ids.length) return out;
  const rows = await query<{ project_id: number; id: number; name: string }>(
    `SELECT m.project_id, u.id, u.name FROM project_members m JOIN users u ON u.id = m.user_id
     WHERE m.project_id = ANY($1::int[]) ORDER BY lower(u.name)`,
    [ids],
  );
  for (const r of rows) out.get(r.project_id)?.push({ id: r.id, name: r.name });
  return out;
}

function toProject(r: Row, members: Person[]): Project {
  // Lead first, then everyone else by name.
  const sorted = [...members].sort((a, b) => Number(b.id === r.lead_id) - Number(a.id === r.lead_id));
  return {
    id: r.id,
    name: r.name,
    customer: r.customer,
    description: r.description,
    status: r.status,
    leadId: r.lead_id,
    leadName: r.lead_name,
    budgetHours: r.budget_hours,
    startDate: r.start_date,
    dueDate: r.due_date,
    hours: r.hours,
    openTasks: r.open_tasks,
    doneTasks: r.done_tasks,
    members: sorted,
  };
}

export async function listProjects(): Promise<Project[]> {
  const rows = await query<Row>(`${SELECT} ${ORDER}`);
  const members = await membersOf(rows.map((r) => r.id));
  return rows.map((r) => toProject(r, members.get(r.id) ?? []));
}

export async function getProject(id: number): Promise<Project | null> {
  if (!Number.isInteger(id)) return null;
  const [row] = await query<Row>(`${SELECT} WHERE p.id = $1`, [id]);
  if (!row) return null;
  return toProject(row, (await membersOf([id])).get(id) ?? []);
}

/** Admins manage every project; a lead manages their own: status, dates, contributors and tasks. */
export function canManage(user: User, project: Pick<Project, "leadId">): boolean {
  return user.role === "admin" || project.leadId === user.id;
}

/** The name of an existing project that clashes with name (case-insensitive), or null. */
export async function projectNameTaken(name: string, exceptId?: number): Promise<string | null> {
  const [row] = await query<{ name: string }>("SELECT name FROM projects WHERE lower(name) = lower($1) AND id <> $2", [name, exceptId ?? 0]);
  return row?.name ?? null;
}

export async function createProject(p: ProjectInput): Promise<number> {
  return transaction(async (tx) => {
    const [row] = await tx.query<{ id: number }>(
      `INSERT INTO projects (name, customer, description, status, lead_id, budget_hours, start_date, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [p.name, p.customer, p.description, p.status, p.leadId, p.budgetHours, p.startDate, p.dueDate],
    );
    if (p.leadId) await tx.query("INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)", [row.id, p.leadId]);
    return row.id;
  });
}

/** Full update (admin). The new lead becomes a contributor; the old lead stays one. */
export async function updateProject(id: number, p: ProjectInput): Promise<void> {
  await transaction(async (tx) => {
    await tx.query(
      `UPDATE projects SET name = $2, customer = $3, description = $4, status = $5, lead_id = $6, budget_hours = $7,
       start_date = $8, due_date = $9 WHERE id = $1`,
      [id, p.name, p.customer, p.description, p.status, p.leadId, p.budgetHours, p.startDate, p.dueDate],
    );
    if (p.leadId) {
      await tx.query("INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, p.leadId]);
    }
  });
}

/** What a lead may change on their own project. */
export async function updateProjectAsLead(
  id: number,
  p: Pick<ProjectInput, "description" | "status" | "startDate" | "dueDate">,
): Promise<void> {
  await query("UPDATE projects SET description = $2, status = $3, start_date = $4, due_date = $5 WHERE id = $1", [
    id,
    p.description,
    p.status,
    p.startDate,
    p.dueDate,
  ]);
}

/** Deletes a project with its tasks. Refused once anyone logged hours on it: set it to Done instead. */
export async function deleteProject(id: number): Promise<{ error?: string }> {
  const [used] = await query<{ n: number }>("SELECT COUNT(*)::int AS n FROM timesheet_rows WHERE project_id = $1", [id]);
  if (used.n > 0) return { error: "Hours are logged on this project, so it cannot be deleted. Set its status to Done." };
  await query("DELETE FROM projects WHERE id = $1", [id]);
  return {};
}

export async function addMember(projectId: number, userId: number): Promise<void> {
  await query(
    `INSERT INTO project_members (project_id, user_id)
     SELECT $1, id FROM users WHERE id = $2 AND NOT disabled ON CONFLICT DO NOTHING`,
    [projectId, userId],
  );
}

/** Removes a contributor (never the lead). Their open tasks in this project become unassigned. */
export async function removeMember(projectId: number, userId: number): Promise<void> {
  await transaction(async (tx) => {
    const [p] = await tx.query<{ lead_id: number | null }>("SELECT lead_id FROM projects WHERE id = $1", [projectId]);
    if (!p || p.lead_id === userId) return;
    await tx.query("DELETE FROM project_members WHERE project_id = $1 AND user_id = $2", [projectId, userId]);
    await tx.query("UPDATE tasks SET assignee_id = NULL, updated_at = NOW() WHERE project_id = $1 AND assignee_id = $2 AND status <> 'done'", [
      projectId,
      userId,
    ]);
  });
}

export async function isMember(projectId: number, userId: number): Promise<boolean> {
  const rows = await query<{ n: number }>("SELECT 1 AS n FROM project_members WHERE project_id = $1 AND user_id = $2", [projectId, userId]);
  return rows.length > 0;
}

/** Everyone who can sign in, for lead and contributor pickers. */
export async function listActivePeople(): Promise<Person[]> {
  return query<Person>("SELECT id, name FROM users WHERE NOT disabled ORDER BY lower(name)");
}

/** Per-person hours on one project, all time. Admin view only (hours are private to each person). */
export async function projectHoursByPerson(projectId: number): Promise<{ id: number; name: string; hours: number }[]> {
  return query(
    `SELECT u.id, u.name, SUM(e.hours)::float8 AS hours
     FROM timesheet_rows r JOIN time_entries e ON e.row_id = r.id JOIN users u ON u.id = r.user_id
     WHERE r.project_id = $1 GROUP BY u.id, u.name ORDER BY hours DESC, lower(u.name)`,
    [projectId],
  );
}
