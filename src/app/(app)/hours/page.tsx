import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { projectOptions, weekEntries } from "@/lib/work/hours";
import { isIsoDate, mondayOf } from "@/lib/work/shared";
import { today } from "@/lib/work/today";
import { Timecard } from "./Timecard";
import "@/components/work/work.css";
import "./hours.css";

export const metadata = { title: "Hours" };

type Search = { week?: string; day?: string; project?: string };

export default async function HoursPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser();
  const { week, day, project } = await searchParams;
  const now = await today();
  const thisMonday = mondayOf(now);
  const asked = isIsoDate(day) ? day : isIsoDate(week) ? week : now;
  const monday = mondayOf(asked) <= thisMonday ? mondayOf(asked) : thisMonday;
  const [entries, projects] = await Promise.all([weekEntries(user.id, monday), projectOptions(user.id)]);
  const wanted = Number(project);
  const initialProjectId = projects.some((p) => p.id === wanted) ? wanted : null;
  // Open on the asked day, else today in this week, else the week's Monday.
  const initialDay = isIsoDate(day) && mondayOf(day) === monday ? day : monday === thisMonday ? now : monday;

  return (
    <div className="shell page hours-page">
      <div className="page-head">
        <div>
          <h1>Hours</h1>
          <p>Pick a day, pick a project, enter the hours. The project&apos;s hours update at once. Only you and admins see your hours.</p>
        </div>
        {user.role === "admin" && (
          <Link href="/hours/team" className="btn">
            Team hours
          </Link>
        )}
      </div>
      <Timecard
        key={`${monday}-${initialProjectId ?? ""}-${now}`}
        monday={monday}
        thisMonday={thisMonday}
        today={now}
        entries={entries}
        projects={projects}
        initialDay={initialDay}
        initialProjectId={initialProjectId}
      />
    </div>
  );
}
