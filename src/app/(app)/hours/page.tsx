import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { projectOptions, weekEntries, type Entry } from "@/lib/work/hours";
import { addDays, formatDate, formatHours, formatWeek, formatWeekday, isIsoDate, mondayOf } from "@/lib/work/shared";
import { today } from "@/lib/work/today";
import { LogForm } from "./LogForm";
import { EntryItem } from "./EntryItem";
import "@/components/work/work.css";
import "./hours.css";

export const metadata = { title: "Hours" };

type Search = { week?: string; project?: string };

export default async function HoursPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser();
  const { week, project } = await searchParams;
  const now = today();
  const thisMonday = mondayOf(now);
  const monday = isIsoDate(week) && mondayOf(week) <= thisMonday ? mondayOf(week) : thisMonday;
  const [entries, projects] = await Promise.all([weekEntries(user.id, monday), projectOptions(user.id)]);
  const wanted = Number(project);
  const initialProjectId = projects.some((p) => p.id === wanted) ? wanted : null;

  const days = new Map<string, Entry[]>();
  for (const e of entries) days.set(e.date, [...(days.get(e.date) ?? []), e]);
  const total = entries.reduce((s, e) => s + e.hours, 0);
  const isThisWeek = monday === thisMonday;
  const year = now.slice(0, 4);

  return (
    <div className="shell page hours-page">
      <div className="page-head">
        <div>
          <h1>Hours</h1>
          <p>Pick a project, tap the hours, log. The project&apos;s hours update at once. Only you and admins see your hours.</p>
        </div>
        {user.role === "admin" && (
          <Link href="/hours/team" className="btn">
            Team hours
          </Link>
        )}
      </div>

      <div className="hours-layout">
        <LogForm key={initialProjectId ?? "log"} projects={projects} today={now} yesterday={addDays(now, -1)} initialProjectId={initialProjectId} />

        <section className="week" aria-labelledby="week-title">
          <div className="week-head">
            <div>
              <h2 id="week-title" className="card-title">
                {isThisWeek ? "This week" : "Week of " + formatDate(monday, year)}
              </h2>
              <p className="hint">{formatWeek(monday)}</p>
            </div>
            <p className="week-total">
              <strong>{formatHours(total)}</strong> h
            </p>
          </div>
          <nav className="week-nav" aria-label="Week">
            <Link className="btn btn-sm" href={`/hours?week=${addDays(monday, -7)}`}>
              <ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" /> Previous week
            </Link>
            {!isThisWeek && (
              <>
                <Link className="btn btn-sm" href={`/hours?week=${addDays(monday, 7)}`}>
                  Next week <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
                </Link>
                <Link className="btn btn-sm" href="/hours">
                  This week
                </Link>
              </>
            )}
          </nav>

          {entries.length === 0 ? (
            <p className="empty">{isThisWeek ? "Nothing logged this week yet. Log your first entry with the form." : "Nothing logged that week."}</p>
          ) : (
            <ol className="days">
              {[...days.entries()].reverse().map(([date, list]) => (
                <li key={date} className="day card">
                  <h3 className="day-head">
                    <span>
                      {date === now ? "Today" : formatWeekday(date)} · {formatDate(date, year)}
                    </span>
                    <span className="day-total">{formatHours(list.reduce((s, e) => s + e.hours, 0))} h</span>
                  </h3>
                  <ul className="entries">
                    {list.map((e) => (
                      <EntryItem key={`${e.rowId}-${e.date}`} e={e} />
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
