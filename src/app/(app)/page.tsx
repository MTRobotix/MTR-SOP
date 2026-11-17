import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CircleAlert, Clock, FolderKanban } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { sopOverview } from "@/lib/content/repo";
import { homeStats } from "@/lib/work/home";
import { listLedTasks, listMyTasks, type MyTask } from "@/lib/work/tasks";
import { today } from "@/lib/work/today";
import { formatDate, formatHours, formatLongDay, formatWeekday, mondayOf, weekDays } from "@/lib/work/shared";
import { SearchBox } from "@/components/SearchBox";
import "@/components/work/work.css";
import "./home.css";

// The greeting and search render at once; each tile streams in as its own query returns (mtr-home-ui §6 "Home bento").
export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  // Old search links were /?q=…; results live on /sop.
  const { q } = await searchParams;
  if (q) redirect(`/sop?q=${encodeURIComponent(q)}`);

  const user = await requireUser();
  const now = await today();

  return (
    <div className="shell page home">
      <div className="bento">
        <section className="box home-hero" aria-label="Search the SOP">
          <div>
            <p className="hero-date">{formatLongDay(now)}</p>
            <h1>Hi, {user.name.split(" ")[0]}. What do you need?</h1>
          </div>
          <SearchBox />
        </section>

        <Suspense fallback={<TileSkeleton className="home-hours" label="Hours" />}>
          <HoursTile userId={user.id} now={now} />
        </Suspense>
        <Suspense fallback={<TileSkeleton label="Projects" />}>
          <ProjectsTile userId={user.id} now={now} />
        </Suspense>
        <Suspense fallback={<TileSkeleton label="SOP" />}>
          <SopTile />
        </Suspense>
        <Suspense fallback={<TileSkeleton className="home-wide" label="Tasks" />}>
          <TaskTiles userId={user.id} now={now} />
        </Suspense>
      </div>
    </div>
  );
}

function TileSkeleton({ className = "", label }: { className?: string; label: string }) {
  return (
    <section className={`box card ${className}`} aria-busy="true" aria-label={`${label}: loading`}>
      <span className="skeleton skeleton-line" />
      <span className="skeleton skeleton-block" />
    </section>
  );
}

type Day = { date: string; hours: number };

/** This week: a ring with one segment per day (filled = hours logged), then the hours per day. */
async function HoursTile({ userId, now }: { userId: number; now: string }) {
  const monday = mondayOf(now);
  const { hoursByDay } = await homeStats(userId, monday, now);
  const days: Day[] = weekDays(monday).map((date) => ({ date, hours: hoursByDay[date] ?? 0 }));
  const total = days.reduce((sum, d) => sum + d.hours, 0);
  const logged = days.filter((d) => d.hours > 0).length;
  // Bars share one scale: a normal day (8 h) is full height unless someone logged more.
  const scale = Math.max(8, ...days.map((d) => d.hours));
  const year = now.slice(0, 4);

  return (
    <section className="box card home-hours" aria-labelledby="home-hours">
      <h2 className="box-label" id="home-hours">
        <Clock size={18} strokeWidth={1.5} aria-hidden="true" /> Hours this week
      </h2>
      <WeekRing days={days} total={total} logged={logged} />
      <ol className="day-row" aria-label="Hours per day">
        {days.map((d) => {
          const future = d.date > now;
          const cls = `day${d.date === now ? " is-today" : ""}${d.hours > 0 ? "" : " is-empty"}`;
          const cell = (
            <>
              <span className="day-bar" aria-hidden="true">
                <i style={{ height: `${Math.round((d.hours / scale) * 100)}%` }} />
              </span>
              <b>{future ? "–" : formatHours(d.hours)}</b>
              <span>{formatWeekday(d.date)}</span>
            </>
          );
          return (
            <li key={d.date}>
              {future ? (
                <span className={cls}>{cell}</span>
              ) : (
                <Link href={`/hours?day=${d.date}`} className={cls} aria-label={`${formatWeekday(d.date)} ${formatDate(d.date, year)}: ${formatHours(d.hours)} h`}>
                  {cell}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <Link href="/hours" className="btn btn-primary">
        Log hours for today
      </Link>
    </section>
  );
}

const RING_R = 52;
const RING_GAP = 6;
const RING_C = 2 * Math.PI * RING_R;
const RING_SEG = RING_C / 7 - RING_GAP;

function WeekRing({ days, total, logged }: { days: Day[]; total: number; logged: number }) {
  return (
    <div className="ring" role="img" aria-label={`${formatHours(total)} h logged this week, on ${logged} of 7 days`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        {days.map((d, i) => (
          <circle
            key={d.date}
            cx="60"
            cy="60"
            r={RING_R}
            className={d.hours > 0 ? "ring-on" : "ring-off"}
            strokeDasharray={`${RING_SEG.toFixed(2)} ${(RING_C - RING_SEG).toFixed(2)}`}
            strokeDashoffset={(-i * (RING_SEG + RING_GAP)).toFixed(2)}
          />
        ))}
      </svg>
      <p>
        <b>{formatHours(total)} h</b>
        <span>
          {logged} of 7 days
        </span>
      </p>
    </div>
  );
}

async function ProjectsTile({ userId, now }: { userId: number; now: string }) {
  const { ongoing, overdue, overdueLabel } = await homeStats(userId, mondayOf(now), now);
  return (
    <section className="box card" aria-labelledby="home-projects">
      <h2 className="box-label" id="home-projects">
        <FolderKanban size={18} strokeWidth={1.5} aria-hidden="true" /> Projects
      </h2>
      <p className="big-figure">
        {ongoing} <span>ongoing</span>
      </p>
      {overdue > 0 && (
        <p className="flag flag-danger">
          <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" /> {overdue} overdue
          {overdue === 1 && overdueLabel && (
            <>
              {" · "}
              <span className="task-code">{overdueLabel}</span>
            </>
          )}
        </p>
      )}
      <Link href="/projects" className="box-more">
        Open projects <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
      </Link>
    </section>
  );
}

async function SopTile() {
  const { total, recent } = await sopOverview(3);
  return (
    <section className="box card" aria-labelledby="home-sop">
      <h2 className="box-label" id="home-sop">
        <BookOpen size={18} strokeWidth={1.5} aria-hidden="true" /> New in the SOP
      </h2>
      {recent.length === 0 ? (
        <p className="box-empty">No sections yet.</p>
      ) : (
        <ul className="recent-list">
          {recent.map((d) => (
            <li key={`${d.dept}/${d.slug}`}>
              <Link href={`/d/${d.dept}/${d.slug}`}>{d.meta.title}</Link>
              <span>{d.deptTitle}</span>
            </li>
          ))}
        </ul>
      )}
      <Link href="/sop" className="box-more">
        Browse all {total} section{total === 1 ? "" : "s"} <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
      </Link>
    </section>
  );
}

async function TaskTiles({ userId, now }: { userId: number; now: string }) {
  const [tasks, led] = await Promise.all([listMyTasks(userId), listLedTasks(userId)]);
  return (
    <>
      <section className="box card home-wide" aria-labelledby="my-tasks">
        <h2 className="box-title" id="my-tasks">
          Your open tasks {tasks.length > 0 && <span>· {tasks.length}</span>}
        </h2>
        {tasks.length === 0 ? <p className="box-empty">No open tasks assigned to you.</p> : <TaskRows tasks={tasks} now={now} />}
      </section>
      {led.length > 0 && (
        <section className="box card home-wide" aria-labelledby="led-tasks">
          <h2 className="box-title" id="led-tasks">
            In projects you lead <span>· {led.length}</span>
          </h2>
          <TaskRows tasks={led} now={now} showAssignee />
        </section>
      )}
    </>
  );
}

/** Open tasks, one row each: project code, title (and who has it), due date or Overdue. */
function TaskRows({ tasks, now, showAssignee = false }: { tasks: MyTask[]; now: string; showAssignee?: boolean }) {
  const year = now.slice(0, 4);
  return (
    <ul className="task-grid">
      {tasks.map((t) => {
        const late = t.dueDate !== null && t.dueDate < now;
        return (
          <li key={t.id}>
            <Link href={`/projects/${t.projectId}/tasks/${t.id}`} className="task-item">
              <span className="task-code" title={t.projectName}>
                {t.projectCode || t.projectName}
              </span>
              <span className="task-title">
                {t.title}
                {showAssignee && <span className="task-meta"> · {t.assigneeName ?? "Unassigned"}</span>}
              </span>
              {t.dueDate && (
                <span className={`task-due${late ? " flag flag-danger" : ""}`}>
                  {late && <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" />}
                  {late ? "Overdue · " : "Due "}
                  {formatDate(t.dueDate, year)}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
