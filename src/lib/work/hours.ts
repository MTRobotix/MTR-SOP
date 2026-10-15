import "server-only";
import { query, transaction, type Tx } from "../db";
import { NEXT_CODE } from "./projects";
import { cleanName, formatDate, formatHours, formatWeekday, isIsoDate, mondayOf, projectLabel, MAX_DAY_HOURS, type ProjectStatus } from "./shared";

export type ProjectOption = { id: number; code: string; name: string; customer: string; mine: boolean };

export const MAX_NOTE = 200;

/** One logged entry: one person, one project (or an old free-text name), one day. */
export type Entry = {
  rowId: number;
  date: string;
  projectId: number | null;
  code: string;
  label: string;
  customer: string;
  hours: number;
  note: string;
};

/** Everything one person logged in the week that starts on monday, oldest day first. */
export async function weekEntries(userId: number, monday: string): Promise<Entry[]> {
  return query<Entry>(
    `SELECT r.id AS "rowId", e.work_date::text AS date, r.project_id AS "projectId", COALESCE(p.code, '') AS code,
       COALESCE(p.name, r.custom_name) AS label, COALESCE(p.customer, '') AS customer, e.hours::float8 AS hours,
       COALESCE(NULLIF(e.note, ''), r.note) AS note
     FROM time_entries e JOIN timesheet_rows r ON r.id = e.row_id LEFT JOIN projects p ON p.id = r.project_id
     WHERE r.user_id = $1 AND r.week_start = $2
     ORDER BY e.work_date, r.position, r.id`,
    [userId, monday],
  );
}

export async function weekTotal(userId: number, monday: string): Promise<number> {
  const [row] = await query<{ h: number }>(
    `SELECT COALESCE(SUM(e.hours), 0)::float8 AS h FROM time_entries e JOIN timesheet_rows r ON r.id = e.row_id
     WHERE r.user_id = $1 AND r.week_start = $2`,
    [userId, monday],
  );
  return row.h;
}

/**
 * Projects people can log hours on: everything not Done.
 * "mine" = the person is a contributor or logged on it in the last 30 days; those come first, most recent first.
 */
export async function projectOptions(userId: number): Promise<ProjectOption[]> {
  return query<ProjectOption>(
    `SELECT p.id, COALESCE(p.code, '') AS code, p.name, p.customer,
       (m.user_id IS NOT NULL OR l.last IS NOT NULL) AS mine
     FROM projects p
     LEFT JOIN project_members m ON m.project_id = p.id AND m.user_id = $1
     LEFT JOIN (
       SELECT r.project_id, MAX(e.work_date) AS last FROM timesheet_rows r JOIN time_entries e ON e.row_id = r.id
       WHERE r.user_id = $1 AND e.work_date > CURRENT_DATE - 30 GROUP BY r.project_id
     ) l ON l.project_id = p.id
     WHERE p.status <> 'done'
     ORDER BY (m.user_id IS NOT NULL OR l.last IS NOT NULL) DESC, l.last DESC NULLS LAST, lower(COALESCE(p.code, p.name))`,
    [userId],
  );
}

type Result = { ok?: string; error?: string };

async function dayTotal(tx: Tx, userId: number, date: string, except?: { rowId: number }): Promise<number> {
  const [row] = await tx.query<{ h: number }>(
    `SELECT COALESCE(SUM(e.hours), 0)::float8 AS h FROM time_entries e JOIN timesheet_rows r ON r.id = e.row_id
     WHERE r.user_id = $1 AND e.work_date = $2 AND r.id <> $3`,
    [userId, date, except?.rowId ?? 0],
  );
  return row.h;
}

const dayName = (date: string) => `${formatWeekday(date)} ${formatDate(date, date.slice(0, 4))}`;

/**
 * Adds hours to one project on one day. Logging the same project and day again adds to it.
 * The project follows: the person becomes a contributor, and a project still in Planning becomes Active.
 */
export async function logTime(userId: number, input: { projectId: number; date: string; hours: number; note: string }, today: string): Promise<Result> {
  const { projectId, date, hours } = input;
  const note = input.note.replace(/\s+/g, " ").trim();
  if (!isIsoDate(date)) return { error: "Pick a day." };
  if (date > today) return { error: "You can log hours up to today, not ahead." };
  if (!(hours > 0 && hours <= MAX_DAY_HOURS)) return { error: `Hours: a number above 0, at most ${MAX_DAY_HOURS}.` };
  if (note.length > MAX_NOTE) return { error: `Note: at most ${MAX_NOTE} characters.` };
  return transaction(async (tx) => {
    const [p] = await tx.query<{ id: number; code: string | null; name: string; status: ProjectStatus }>(
      "SELECT id, code, name, status FROM projects WHERE id = $1",
      [projectId],
    );
    if (!p) return { error: "Pick a project from the list." };
    if (p.status === "done") return { error: `${projectLabel(p)} is done. Pick an ongoing project.` };
    const already = await dayTotal(tx, userId, date);
    if (already + hours > MAX_DAY_HOURS) {
      return { error: `${dayName(date)} already has ${formatHours(already)} h. ${formatHours(hours)} h more is over ${MAX_DAY_HOURS} h.` };
    }
    const monday = mondayOf(date);
    let [row] = await tx.query<{ id: number }>("SELECT id FROM timesheet_rows WHERE user_id = $1 AND week_start = $2 AND project_id = $3", [
      userId,
      monday,
      projectId,
    ]);
    if (!row) {
      [row] = await tx.query<{ id: number }>(
        `INSERT INTO timesheet_rows (user_id, week_start, project_id, position)
         SELECT $1, $2, $3, COALESCE(MAX(position) + 1, 0) FROM timesheet_rows WHERE user_id = $1 AND week_start = $2 RETURNING id`,
        [userId, monday, projectId],
      );
    }
    await tx.query(
      `INSERT INTO time_entries (row_id, work_date, hours, note) VALUES ($1, $2, $3, $4)
       ON CONFLICT (row_id, work_date) DO UPDATE SET hours = time_entries.hours + EXCLUDED.hours,
         note = concat_ws('; ', NULLIF(time_entries.note, ''), NULLIF(EXCLUDED.note, ''))`,
      [row.id, date, hours, note],
    );
    await tx.query("INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [projectId, userId]);
    await tx.query("UPDATE projects SET status = 'active' WHERE id = $1 AND status = 'planning'", [projectId]);
    return { ok: `Logged ${formatHours(hours)} h on ${projectLabel(p)} for ${dayName(date)}.` };
  });
}

/** Sets one entry's hours and note. Only the person who logged it can change it. */
export async function updateEntry(userId: number, rowId: number, date: string, hours: number, note: string): Promise<Result> {
  const clean = note.replace(/\s+/g, " ").trim();
  if (!isIsoDate(date)) return { error: "That entry no longer exists. Reload the page." };
  if (!(hours > 0 && hours <= MAX_DAY_HOURS)) return { error: `Hours: a number above 0, at most ${MAX_DAY_HOURS}. To remove the entry, delete it.` };
  if (clean.length > MAX_NOTE) return { error: `Note: at most ${MAX_NOTE} characters.` };
  return transaction(async (tx) => {
    const others = await dayTotal(tx, userId, date, { rowId });
    if (others + hours > MAX_DAY_HOURS) return { error: `${dayName(date)} would have ${formatHours(others + hours)} h, more than ${MAX_DAY_HOURS} h.` };
    const done = await tx.query<{ row_id: number }>(
      `UPDATE time_entries e SET hours = $3, note = $4 FROM timesheet_rows r
       WHERE e.row_id = r.id AND r.id = $1 AND r.user_id = $2 AND e.work_date = $5 RETURNING e.row_id`,
      [rowId, userId, hours, clean, date],
    );
    if (!done.length) return { error: "That entry no longer exists. Reload the page." };
    return { ok: "Saved." };
  });
}

/** Removes one entry. A week line left with no hours goes too. */
export async function deleteEntry(userId: number, rowId: number, date: string): Promise<Result> {
  return transaction(async (tx) => {
    const gone = await tx.query<{ row_id: number }>(
      `DELETE FROM time_entries e USING timesheet_rows r WHERE e.row_id = r.id AND r.id = $1 AND r.user_id = $2 AND e.work_date = $3
       RETURNING e.row_id`,
      [rowId, userId, date],
    );
    if (!gone.length) return { error: "That entry no longer exists. Reload the page." };
    await tx.query("DELETE FROM timesheet_rows r WHERE r.id = $1 AND NOT EXISTS (SELECT 1 FROM time_entries e WHERE e.row_id = r.id)", [rowId]);
    return { ok: "Deleted." };
  });
}

// ── Team report (admin) ─────────────────────────────────────────────────────

export type ReportFilter = { from: string; to: string; userId: number | null; project: number | "custom" | null };

export type ReportEntry = {
  date: string;
  userId: number;
  person: string;
  email: string;
  projectId: number | null;
  code: string;
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
       COALESCE(p.code, '') AS code, COALESCE(p.name, r.custom_name) AS project, COALESCE(p.customer, '') AS customer,
       e.hours::float8 AS hours, COALESCE(NULLIF(e.note, ''), r.note) AS note
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
      const [{ code }] = await tx.query<{ code: string }>(NEXT_CODE);
      const [row] = await tx.query<{ id: number }>("INSERT INTO projects (code, name, status) VALUES ($1, $2, 'active') RETURNING id", [
        code,
        cleanName(name),
      ]);
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
      `INSERT INTO time_entries (row_id, work_date, hours, note)
       SELECT t.id, e.work_date, e.hours, e.note FROM timesheet_rows c JOIN time_entries e ON e.row_id = c.id, timesheet_rows t WHERE ${same}
       ON CONFLICT (row_id, work_date) DO UPDATE SET hours = LEAST(${MAX_DAY_HOURS}, time_entries.hours + EXCLUDED.hours),
         note = concat_ws('; ', NULLIF(time_entries.note, ''), NULLIF(EXCLUDED.note, ''))`,
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
