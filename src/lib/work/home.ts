import "server-only";
import { cache } from "react";
import { query } from "../db";

export type HomeStats = {
  /** Hours the person logged this week, by day ("YYYY-MM-DD"). Days without hours are absent. */
  hoursByDay: Record<string, number>;
  /** Projects that are not Done. */
  ongoing: number;
  /** Ongoing projects past their due date. */
  overdue: number;
  /** Code (or name) of the longest-overdue project, for "1 overdue · P-002". */
  overdueLabel: string | null;
};

type Row = { days: string; ongoing: number; overdue: number; overdue_label: string | null };

/**
 * Everything the home tiles count, in one round trip: this week's hours by day and the project counts.
 * Reads only what home shows; the projects page keeps its own, heavier query (hours and tasks per project).
 * Deduped per request, so the Hours and Projects tiles share one query.
 */
export const homeStats = cache(async (userId: number, monday: string, today: string): Promise<HomeStats> => {
  const [row] = await query<Row>(
    `SELECT
       COALESCE((
         SELECT json_object_agg(x.d, x.h) FROM (
           SELECT e.work_date::text AS d, SUM(e.hours)::float8 AS h
           FROM time_entries e JOIN timesheet_rows r ON r.id = e.row_id
           WHERE r.user_id = $1 AND r.week_start = $2 GROUP BY e.work_date
         ) x
       ), '{}'::json)::text AS days,
       (SELECT COUNT(*)::int FROM projects WHERE status <> 'done') AS ongoing,
       (SELECT COUNT(*)::int FROM projects WHERE status <> 'done' AND due_date < $3) AS overdue,
       (SELECT COALESCE(code, name) FROM projects WHERE status <> 'done' AND due_date < $3 ORDER BY due_date, id LIMIT 1) AS overdue_label`,
    [userId, monday, today],
  );
  return { hoursByDay: JSON.parse(row.days) as Record<string, number>, ongoing: row.ongoing, overdue: row.overdue, overdueLabel: row.overdue_label };
});
