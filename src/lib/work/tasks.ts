import "server-only";
import { query } from "../db";
import type { TaskStatus } from "./shared";

export type Task = {
  id: number;
  projectId: number;
  title: string;
  notes: string;
  status: TaskStatus;
  assigneeId: number | null;
  assigneeName: string | null;
  dueDate: string | null;
  createdByName: string | null;
  updatedAt: string;
};

export type MyTask = Task & { projectName: string };

export type TaskInput = { title: string; notes: string; status: TaskStatus; assigneeId: number | null; dueDate: string | null };

type Row = {
  id: number;
  project_id: number;
  title: string;
  notes: string;
  status: TaskStatus;
  assignee_id: number | null;
  assignee_name: string | null;
  due_date: string | null;
  created_by_name: string | null;
  updated_at: string;
  project_name: string;
};

const SELECT = `
SELECT t.id, t.project_id, t.title, t.notes, t.status, t.assignee_id, a.name AS assignee_name,
  t.due_date::text AS due_date, c.name AS created_by_name, t.updated_at::text AS updated_at, p.name AS project_name
FROM tasks t
JOIN projects p ON p.id = t.project_id
LEFT JOIN users a ON a.id = t.assignee_id
LEFT JOIN users c ON c.id = t.created_by`;

function toTask(r: Row): MyTask {
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    notes: r.notes,
    status: r.status,
    assigneeId: r.assignee_id,
    assigneeName: r.assignee_name,
    dueDate: r.due_date,
    createdByName: r.created_by_name,
    updatedAt: r.updated_at,
    projectName: r.project_name,
  };
}

export async function listTasks(projectId: number): Promise<Task[]> {
  const rows = await query<Row>(`${SELECT} WHERE t.project_id = $1 ORDER BY t.due_date NULLS LAST, t.id`, [projectId]);
  return rows.map(toTask);
}

export async function getTask(id: number): Promise<MyTask | null> {
  if (!Number.isInteger(id)) return null;
  const [row] = await query<Row>(`${SELECT} WHERE t.id = $1`, [id]);
  return row ? toTask(row) : null;
}

/** Open tasks assigned to one person, soonest due first. */
export async function listMyTasks(userId: number): Promise<MyTask[]> {
  const rows = await query<Row>(
    `${SELECT} WHERE t.assignee_id = $1 AND t.status <> 'done' AND p.status <> 'done' ORDER BY t.due_date NULLS LAST, t.id`,
    [userId],
  );
  return rows.map(toTask);
}

export async function countOpenTasks(): Promise<number> {
  const [row] = await query<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.status <> 'done' AND p.status <> 'done'",
  );
  return row.n;
}

export async function createTask(projectId: number, t: TaskInput, createdBy: number): Promise<void> {
  await query(
    `INSERT INTO tasks (project_id, title, notes, status, assignee_id, due_date, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [projectId, t.title, t.notes, t.status, t.assigneeId, t.dueDate, createdBy],
  );
}

export async function updateTask(id: number, t: TaskInput): Promise<void> {
  await query(
    `UPDATE tasks SET title = $2, notes = $3, status = $4, assignee_id = $5, due_date = $6, updated_at = NOW() WHERE id = $1`,
    [id, t.title, t.notes, t.status, t.assigneeId, t.dueDate],
  );
}

export async function setTaskStatus(id: number, status: TaskStatus): Promise<void> {
  await query("UPDATE tasks SET status = $2, updated_at = NOW() WHERE id = $1", [id, status]);
}

export async function deleteTask(id: number): Promise<void> {
  await query("DELETE FROM tasks WHERE id = $1", [id]);
}
