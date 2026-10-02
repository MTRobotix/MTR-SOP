import "server-only";
import { query, transaction } from "../db";
import {
  addDays,
  cleanName,
  formatDate,
  formatWeekday,
  isIsoDate,
  mondayOf,
  weekDays,
  MAX_DAY_HOURS,
  MAX_ROWS_PER_WEEK,
  type ProjectStatus,
} from "./shared";

/** One line of a weekly timesheet. hours[0] is Monday; 0 means nothing logged that day. */
export type SheetRow = {
  projectId: number | null;
  customName: string | null;
  label: string;
  customer: string;
  projectStatus: ProjectStatus | null;
  note: string;
  hours: number[];
};

export type SheetRowInput = { projectId: number | null; customName: string | null; note: string; hours: number[] };

export type ProjectOption = { id: number; name: string; customer: string; mine: boolean };

export const MAX_NAME = 80;
export const MAX_NOTE = 200;

type RowRecord = {
  id: number;
  project_id: number | null;
  custom_name: string | null;
  note: string;
  name: string | null;
  customer: string | null;
  status: ProjectStatus | null;
};

async function rowsOfWeek(userId: number, monday: string): Promise<SheetRow[]> {
  const rows = await query<RowRecord>(
    `SELECT r.id, r.project_id, r.custom_name, r.note, p.name, p.customer, p.status
     FROM timesheet_rows r LEFT JOIN projects p ON p.id = r.project_id
     WHERE r.user_id = $1 AND r.week_start = $2 ORDER BY r.position, r.id`,
    [userId, monday],
  );
  const entries = await query<{ row_id: number; work_date: string; hours: number }>(
    `SELECT e.row_id, e.work_date::text AS work_date, e.hours::float8 AS hours
     FROM time_entries e JOIN timesheet_rows r ON r.id = e.row_id WHERE r.user_id = $1 AND r.week_start = $2`,
    [userId, monday],
  );
  const days = weekDays(monday);
  const byRow = new Map<number, number[]>(rows.map((r) => [r.id, Array(7).fill(0)]));
  for (const e of entries) {
    const i = days.indexOf(e.work_date);
    if (i >= 0) byRow.get(e.row_id)![i] = e.hours;
  }
  return rows.map((r) => ({
    projectId: r.project_id,
    customName: r.custom_name,
    label: r.name ?? r.custom_name ?? "",
    customer: r.customer ?? "",
    projectStatus: r.status,
    note: r.note,
    hours: byRow.get(r.id)!,
  }));
}

export function getWeek(userId: number, monday: string): Promise<SheetRow[]> {
  return rowsOfWeek(userId, monday);
}

/** Last week's lines without hours, to start a new week from. Done projects are left out. */
export async function previousWeekRows(userId: number, monday: string): Promise<SheetRow[]> {
  const rows = await rowsOfWeek(userId, addDays(monday, -7));
  return rows.filter((r) => r.projectStatus !== "done").map((r) => ({ ...r, note: "", hours: Array(7).fill(0) }));
}

export async function weekTotal(userId: number, monday: string): Promise<number> {
  const [row] = await query<{ h: number }>(
    `SELECT COALESCE(SUM(e.hours), 0)::float8 AS h FROM time_entries e JOIN timesheet_rows r ON r.id = e.row_id
     WHERE r.user_id = $1 AND r.week_start = $2`,
    [userId, monday],
  );
  return row.h;
}

/** Projects people can log hours on: everything not Done. "mine" = the person is a contributor. */
export async function projectOptions(userId: number): Promise<ProjectOption[]> {
  return query<ProjectOption>(
    `SELECT p.id, p.name, p.customer, (m.user_id IS NOT NULL) AS mine
     FROM projects p LEFT JOIN project_members m ON m.project_id = p.id AND m.user_id = $1
     WHERE p.status <> 'done' ORDER BY lower(p.name)`,
    [userId],
  );
}

/** Replaces one person's week. Validates everything; returns the saved rows or an error to show. */
export async function saveWeek(userId: number, monday: string, input: unknown): Promise<{ rows?: SheetRow[]; error?: string }> {
  if (!isIsoDate(monday) || mondayOf(monday) !== monday) return { error: "That week does not exist. Reload the page." };
  if (!Array.isArray(input)) return { error: "Nothing to save. Reload the page." };
  if (input.length > MAX_ROWS_PER_WEEK) return { error: `A week holds at most ${MAX_ROWS_PER_WEEK} rows.` };

  const projects = await query<{ id: number; name: string; status: ProjectStatus }>("SELECT id, name, status FROM projects");
  const byId = new Map(projects.map((p) => [p.id, p]));
  const byName = new Map(projects.map((p) => [p.name.toLowerCase(), p]));
  const before = new Set((await rowsOfWeek(userId, monday)).map((r) => r.projectId).filter((id) => id !== null));

  const rows: SheetRowInput[] = [];
  const seen = new Set<string>();
  for (const raw of input as Partial<SheetRowInput>[]) {
    let projectId = Number.isInteger(raw?.projectId) ? (raw.projectId as number) : null;
    let customName = typeof raw?.customName === "string" ? cleanName(raw.customName) : null;
    const note = typeof raw?.note === "string" ? raw.note.replace(/\s+/g, " ").trim() : "";
    const hours = Array.isArray(raw?.hours) ? raw.hours : [];
    if (projectId === null && !customName) return { error: "Every row needs a project or a name." };
    if (customName && customName.length > MAX_NAME) return { error: `Names: at most ${MAX_NAME} characters.` };
    if (note.length > MAX_NOTE) return { error: `Notes: at most ${MAX_NOTE} characters.` };
    // A typed name that matches a project is that project.
    if (projectId === null && customName && byName.has(customName.toLowerCase())) {
      projectId = byName.get(customName.toLowerCase())!.id;
    }
    if (projectId !== null) {
      customName = null;
      const p = byId.get(projectId);
      if (!p) return { error: "A project on this sheet was deleted. Remove its row and save again." };
      if (p.status === "done" && !before.has(projectId)) return { error: `${p.name} is done. Pick an ongoing project.` };
    }
    const key = projectId !== null ? `p${projectId}` : `c${customName!.toLowerCase()}`;
    const label = projectId !== null ? byId.get(projectId)!.name : customName!;
    if (seen.has(key)) return { error: `${label} is on this week twice. Keep one row.` };
    seen.add(key);
    if (hours.length !== 7 || !hours.every((h) => typeof h === "number" && Number.isFinite(h) && h >= 0 && h <= MAX_DAY_HOURS)) {
      return { error: `Hours for ${label}: use numbers from 0 to ${MAX_DAY_HOURS}.` };
    }
    rows.push({ projectId, customName, note, hours: hours.map((h) => Math.round(h * 100) / 100) });
  }

  const days = weekDays(monday);
  for (let i = 0; i < 7; i++) {
    const sum = rows.reduce((s, r) => s + r.hours[i], 0);
    if (sum > MAX_DAY_HOURS) {
      const day = `${formatWeekday(days[i])} ${formatDate(days[i], days[i].slice(0, 4))}`;
      return { error: `${day}: ${Math.round(sum * 100) / 100} h is more than ${MAX_DAY_HOURS} h in one day.` };
    }
  }

  await transaction(async (tx) => {
    await tx.query("DELETE FROM timesheet_rows WHERE user_id = $1 AND week_start = $2", [userId, monday]);
    const ids: number[] = [];
    const dates: string[] = [];
    const amounts: number[] = [];
    for (const [pos, r] of rows.entries()) {
      const [row] = await tx.query<{ id: number }>(
        `INSERT INTO timesheet_rows (user_id, week_start, project_id, custom_name, note, position)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [userId, monday, r.projectId, r.customName, r.note, pos],
      );
      r.hours.forEach((h, i) => {
        if (h > 0) {
          ids.push(row.id);
          dates.push(days[i]);
          amounts.push(h);
        }
      });
    }
    if (ids.length) {
      await tx.query(
        "INSERT INTO time_entries (row_id, work_date, hours) SELECT * FROM unnest($1::int[], $2::date[], $3::numeric[])",
        [ids, dates, amounts],
      );
    }
  });
  return { rows: await rowsOfWeek(userId, monday) };
}

// ── Team report (admin) ─────────────────────────────────────────────────────

export type ReportFilter = { from: string; to: string; userId: number | null; project: number | "custom" | null };

export type ReportEntry = {
  date: string;
  userId: number;
  person: string;
  email: string;
  projectId: number | null;
  project: string;
  customer: string;
  hours: number;
  note: string;
};

export async function report(f: ReportFilter): Promise<ReportEntry[]> {
  const where = ["e.work_date BETWEEN $1 AND $2"];
  const params: unknown[] = [f.from, f.to];
  if (f.userId !== null) {
    params.push(f.userId);
    where.push(`r.user_id = $${params.length}`);
  }
  if (f.project === "custom") where.push("r.project_id IS NULL");
  else if (f.project !== null) {
    params.push(f.project);
    where.push(`r.project_id = $${params.length}`);
  }
  return query<ReportEntry>(
    `SELECT e.work_date::text AS date, u.id AS "userId", u.name AS person, u.email, r.project_id AS "projectId",
       COALESCE(p.name, r.custom_name) AS project, COALESCE(p.customer, '') AS customer, e.hours::float8 AS hours, r.note
     FROM time_entries e
     JOIN timesheet_rows r ON r.id = e.row_id
     JOIN users u ON u.id = r.user_id
     LEFT JOIN projects p ON p.id = r.project_id
     WHERE ${where.join(" AND ")}
     ORDER BY e.work_date, lower(u.name), lower(COALESCE(p.name, r.custom_name))`,
    params,
  );
}

export type CustomName = { name: string; hours: number; people: string; lastWeek: string };

/** Free-text names people logged hours under, all time, most hours first. */
export async function customNames(): Promise<CustomName[]> {
  return query<CustomName>(
    `SELECT MIN(r.custom_name) AS name, COALESCE(SUM(e.hours), 0)::float8 AS hours,
       string_agg(DISTINCT u.name, ', ') AS people, MAX(r.week_start)::text AS "lastWeek"
     FROM timesheet_rows r JOIN users u ON u.id = r.user_id LEFT JOIN time_entries e ON e.row_id = r.id
     WHERE r.custom_name IS NOT NULL
     GROUP BY lower(r.custom_name) ORDER BY hours DESC, name`,
  );
}

/**
 * Turns a free-text name into a project: an existing one (projectId) or a new Active project with that name.
 * Every row under the name moves to the project; where a person already has that project in the same week,
 * the hours are added to that row. People who logged it become contributors.
 */
export async function promoteCustom(name: string, target: number | "new"): Promise<{ projectId?: number; error?: string }> {
  return transaction(async (tx) => {
    const [found] = await tx.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM timesheet_rows WHERE lower(custom_name) = lower($1)", [name]);
    if (!found.n) return { error: "No hours are logged under that name any more. Reload the page." };
    let projectId: number;
    if (target === "new") {
      const [taken] = await tx.query<{ id: number }>("SELECT id FROM projects WHERE lower(name) = lower($1)", [name]);
      if (taken) return { error: `A project named ${name} exists. Pick it from the list instead.` };
      const [row] = await tx.query<{ id: number }>("INSERT INTO projects (name, status) VALUES ($1, 'active') RETURNING id", [cleanName(name)]);
      projectId = row.id;
    } else {
      const [p] = await tx.query<{ id: number }>("SELECT id FROM projects WHERE id = $1", [target]);
      if (!p) return { error: "That project no longer exists. Reload the page." };
      projectId = p.id;
    }
    const params = [name, projectId];
    const same = `c.project_id IS NULL AND lower(c.custom_name) = lower($1)
      AND t.user_id = c.user_id AND t.week_start = c.week_start AND t.project_id = $2`;
    await tx.query(
      `INSERT INTO project_members (project_id, user_id)
       SELECT DISTINCT $2::int, user_id FROM timesheet_rows WHERE lower(custom_name) = lower($1) ON CONFLICT DO NOTHING`,
      params,
    );
    // Same person, same week, already has the project: add the hours to that row, then drop the free-text row.
    await tx.query(
      `INSERT INTO time_entries (row_id, work_date, hours)
       SELECT t.id, e.work_date, e.hours FROM timesheet_rows c JOIN time_entries e ON e.row_id = c.id, timesheet_rows t WHERE ${same}
       ON CONFLICT (row_id, work_date) DO UPDATE SET hours = LEAST(${MAX_DAY_HOURS}, time_entries.hours + EXCLUDED.hours)`,
      params,
    );
    await tx.query(
      `UPDATE timesheet_rows t SET note = concat_ws('; ', NULLIF(t.note, ''), NULLIF(c.note, ''))
       FROM timesheet_rows c WHERE ${same} AND c.note <> ''`,
      params,
    );
    await tx.query(`DELETE FROM timesheet_rows c USING timesheet_rows t WHERE ${same}`, params);
    await tx.query("UPDATE timesheet_rows SET project_id = $2, custom_name = NULL WHERE project_id IS NULL AND lower(custom_name) = lower($1)", params);
    return { projectId };
  });
}
