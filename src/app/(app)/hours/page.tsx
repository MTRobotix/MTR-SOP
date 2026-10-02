import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getWeek, previousWeekRows, projectOptions } from "@/lib/work/hours";
import { isIsoDate, mondayOf } from "@/lib/work/shared";
import { today } from "@/lib/work/today";
import { Timesheet } from "./Timesheet";
import "@/components/work/work.css";
import "./hours.css";

export const metadata = { title: "Hours" };

export default async function HoursPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const user = await requireUser();
  const { week } = await searchParams;
  const now = today();
  const thisMonday = mondayOf(now);
  const monday = isIsoDate(week) ? mondayOf(week) : thisMonday;
  const [rows, previous, options] = await Promise.all([getWeek(user.id, monday), previousWeekRows(user.id, monday), projectOptions(user.id)]);

  return (
    <div className="shell page">
      <div className="page-head">
        <div>
          <h1>Hours</h1>
          <p>One row per project. Enter the hours you worked on it each day, then save the week. Only you and admins see your hours.</p>
        </div>
        {user.role === "admin" && (
          <Link href="/hours/team" className="btn">
            Team hours
          </Link>
        )}
      </div>
      <Timesheet key={monday} monday={monday} thisMonday={thisMonday} today={now} initialRows={rows} previous={previous} options={options} />
    </div>
  );
}
