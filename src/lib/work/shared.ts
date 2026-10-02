// Projects, tasks and hours: values and helpers shared by server and client code. No DB access here.

export const PROJECT_STATUSES = ["planning", "active", "on_hold", "done"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  done: "Done",
};
/** Shown on the dashboard by default and offered in the timesheet. */
export const ONGOING: readonly ProjectStatus[] = ["planning", "active", "on_hold"];

export const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
};

export function isProjectStatus(v: unknown): v is ProjectStatus {
  return typeof v === "string" && (PROJECT_STATUSES as readonly string[]).includes(v);
}

export function isTaskStatus(v: unknown): v is TaskStatus {
  return typeof v === "string" && (TASK_STATUSES as readonly string[]).includes(v);
}

/** A budget at or above this share of hours used shows as a warning. */
export const BUDGET_WARN = 0.9;
export const MAX_DAY_HOURS = 24;
export const MAX_ROWS_PER_WEEK = 30;

// Dates are plain "YYYY-MM-DD" strings everywhere. Calendar maths runs in UTC so the result never
// depends on the server's or the browser's time zone.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(v: unknown): v is string {
  if (typeof v !== "string" || !ISO_DATE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the ISO week that contains iso. */
export function mondayOf(iso: string): string {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(iso, -((day + 6) % 7));
}

export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" });
const DAY_MONTH = fmt({ day: "numeric", month: "short" });
const DAY_MONTH_YEAR = fmt({ day: "numeric", month: "short", year: "numeric" });
const WEEKDAY = fmt({ weekday: "short" });

/** "28 Sep", or "28 Sep 2025" outside the given year. */
export function formatDate(iso: string, currentYear?: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return iso.slice(0, 4) === currentYear ? DAY_MONTH.format(d) : DAY_MONTH_YEAR.format(d);
}

export function formatWeekday(iso: string): string {
  return WEEKDAY.format(new Date(`${iso}T00:00:00Z`));
}

/** "28 Sep – 4 Oct 2026" */
export function formatWeek(monday: string): string {
  const sunday = addDays(monday, 6);
  return `${formatDate(monday, sunday.slice(0, 4))} – ${formatDate(sunday)}`;
}

/** 7.5 → "7.5", 8 → "8", 0.25 → "0.25" */
export function formatHours(h: number): string {
  return String(Math.round(h * 100) / 100);
}

/**
 * Parses what people type into an hours cell: "1.5", "1,5" or "1:30". Empty → 0.
 * Returns null when it is not a number of hours between 0 and 24 with at most 2 decimals.
 */
export function parseHours(input: string): number | null {
  const s = input.trim();
  if (!s) return 0;
  let h: number;
  const hm = /^(\d{1,2}):([0-5]\d)$/.exec(s);
  if (hm) h = Number(hm[1]) + Number(hm[2]) / 60;
  else if (/^\d{0,2}([.,]\d{0,2})?$/.test(s)) h = Number(s.replace(",", "."));
  else return null;
  if (!Number.isFinite(h) || h < 0 || h > MAX_DAY_HOURS) return null;
  return Math.round(h * 100) / 100;
}

/** Collapses spaces in a free-text project name. */
export function cleanName(v: string): string {
  return v.replace(/\s+/g, " ").trim();
}
