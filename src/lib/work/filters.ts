import "server-only";
import type { ReportFilter } from "./hours";
import { isIsoDate } from "./shared";
import { today } from "./today";

export type FilterParams = { from?: string; to?: string; user?: string; project?: string };

/** Team-hours filter from query params. Default range: the 1st of this month to today. */
export function parseReportFilter(p: FilterParams): ReportFilter {
  const now = today();
  let from = isIsoDate(p.from) ? p.from : `${now.slice(0, 8)}01`;
  let to = isIsoDate(p.to) ? p.to : now;
  if (from > to) [from, to] = [to, from];
  const userId = Number(p.user);
  const projectId = Number(p.project);
  return {
    from,
    to,
    userId: p.user && Number.isInteger(userId) ? userId : null,
    project: p.project === "custom" ? "custom" : p.project && Number.isInteger(projectId) ? projectId : null,
  };
}

export function filterQuery(f: ReportFilter): string {
  const q = new URLSearchParams({ from: f.from, to: f.to });
  if (f.userId !== null) q.set("user", String(f.userId));
  if (f.project !== null) q.set("project", String(f.project));
  return q.toString();
}
