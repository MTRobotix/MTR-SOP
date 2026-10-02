import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CircleAlert, Clock, FolderKanban } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listDepartments } from "@/lib/content/repo";
import { weekTotal } from "@/lib/work/hours";
import { listProjects } from "@/lib/work/projects";
import { listMyTasks } from "@/lib/work/tasks";
import { today } from "@/lib/work/today";
import { formatDate, formatHours, formatWeek, mondayOf, ONGOING, TASK_STATUS_LABEL } from "@/lib/work/shared";
import "@/components/work/work.css";
import "./home.css";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  // Old search links were /?q=…; search lives on /sop now.
  const { q } = await searchParams;
  if (q) redirect(`/sop?q=${encodeURIComponent(q)}`);

  const user = await requireUser();
  const now = today();
  const monday = mondayOf(now);
  const [depts, hours, projects, tasks] = await Promise.all([listDepartments(), weekTotal(user.id, monday), listProjects(), listMyTasks(user.id)]);
  const ongoing = projects.filter((p) => ONGOING.includes(p.status));
  const overdue = ongoing.filter((p) => p.dueDate && p.dueDate < now).length;
  const year = now.slice(0, 4);

  return (
    <div className="shell page home">
      <div className="page-head">
        <div>
          <h1>Hi, {user.name.split(" ")[0]}</h1>
          <p>Open the SOP, log your hours or check projects.</p>
        </div>
      </div>

      <div className="area-grid">
        <article className="area-card card">
          <h2>
            <BookOpen size={20} strokeWidth={1.5} aria-hidden="true" />
            <Link href="/sop">SOP</Link>
          </h2>
          <p className="area-lead">How we do things, by department.</p>
          <ul className="area-links" aria-label="Departments">
            {depts.map((d) => (
              <li key={d.id}>
                <Link href={`/d/${d.id}`}>{d.meta.title}</Link>
              </li>
            ))}
          </ul>
          <Link href="/sop" className="area-more">
            Search the SOP <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </article>

        <article className="area-card card">
          <h2>
            <Clock size={20} strokeWidth={1.5} aria-hidden="true" />
            <Link href="/hours">Hours</Link>
          </h2>
          <p className="area-lead">This week, {formatWeek(monday)}.</p>
          <p className="area-figure">
            {formatHours(hours)} <span>h logged</span>
          </p>
          <Link href="/hours" className="btn btn-primary area-action">
            Log hours
          </Link>
        </article>

        <article className="area-card card">
          <h2>
            <FolderKanban size={20} strokeWidth={1.5} aria-hidden="true" />
            <Link href="/projects">Projects</Link>
          </h2>
          <p className="area-lead">Status, contributors and tasks.</p>
          <p className="area-figure">
            {ongoing.length} <span>ongoing</span>
          </p>
          {overdue > 0 && (
            <p className="flag flag-danger">
              <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" /> {overdue} overdue
            </p>
          )}
          <Link href="/projects" className="area-more">
            Open the dashboard <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </article>
      </div>

      <section aria-labelledby="my-tasks" className="home-tasks">
        <h2 className="section-title" id="my-tasks">
          Your open tasks
        </h2>
        {tasks.length === 0 ? (
          <p className="empty">No open tasks assigned to you.</p>
        ) : (
          <ul className="task-rows card">
            {tasks.map((t) => (
              <li key={t.id}>
                <Link href={`/projects/${t.projectId}/tasks/${t.id}`} className="task-row">
                  <span className="task-row-title">{t.title}</span>
                  <span className="task-row-meta">
                    {t.projectName} · {TASK_STATUS_LABEL[t.status]}
                  </span>
                  {t.dueDate && (
                    <span className={`task-row-due${t.dueDate < now ? " flag flag-danger" : ""}`}>
                      {t.dueDate < now && <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" />}
                      {t.dueDate < now ? "Overdue · " : "Due "}
                      {formatDate(t.dueDate, year)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
