import "server-only";
import { cookies } from "next/headers";
import { TZ_COOKIE } from "./shared";

function dateIn(timeZone: string): string | null {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return null;
  }
}

/**
 * Today's date as "YYYY-MM-DD" where the person is: their browser's time zone (the tz cookie, set by
 * <TimeZoneCookie>), else APP_TIME_ZONE (an IANA name such as "Asia/Ho_Chi_Minh"), else UTC.
 * Decides which week and day the timesheet opens on, which days are still to come, and when a due date counts as overdue.
 */
export async function today(): Promise<string> {
  let zone: string | undefined;
  try {
    zone = (await cookies()).get(TZ_COOKIE)?.value;
  } catch {
    // Outside a request (scripts): no cookie.
  }
  return (zone && dateIn(zone)) || (process.env.APP_TIME_ZONE && dateIn(process.env.APP_TIME_ZONE)) || dateIn("UTC")!;
}
