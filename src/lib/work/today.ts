import "server-only";

/**
 * Today's date as "YYYY-MM-DD" in APP_TIME_ZONE (an IANA name such as "Asia/Ho_Chi_Minh"; default UTC).
 * Decides which week the timesheet opens on and when a due date counts as overdue.
 */
export function today(): string {
  const parts = (timeZone: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  try {
    return parts(process.env.APP_TIME_ZONE || "UTC");
  } catch {
    return parts("UTC");
  }
}
