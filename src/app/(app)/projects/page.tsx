import Link from "next/link";
import { CircleAlert, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listProjects, type Project } from "@/lib/work/projects";
import { countOpenTasks } from "@/lib/work/tasks";
import { today } from "@/lib/work/today";
import { formatDate, isProjectStatus, ONGOING, PROJECT_STATUSES, PROJECT_STATUS_LABEL, type ProjectStatus } from "@/lib/work/shared";
import { BudgetMeter } from "@/components/work/Meter";
import "@/components/work/work.css";
import "./projects.css";

export const metadata = { title: "Projects" };

type View = "ongoing" | "all" | ProjectStatus;

const VIEWS: { id: View; label: string }[] = [
  { id: "ongoing", label: "Ongoing" },
  ...PROJECT_STATUSES.map((s) => ({ id: s, label: PROJECT_STATUS_LABEL[s] })),
  { id: "all", label: "All" },
];

const inView = (view: View) => (p: Project) => (view === "all" ? true : view === "ongoing" ? ONGOING.includes(p.status) : p.status === view);

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireUser();
  const { view: rawView } = await searchParams;
  const view: View = rawView === "all" || isProjectStatus(rawView) ? rawView : "ongoing";
  const [projects, openTasks] = await Promise.all([listProjects(), countOpenTasks()]);
  const now = today();
  const year = now.slice(0, 4);

  const ongoing = projects.filter(inView("ongoing"));
  const isOverdue = (p: Project) => p.status !== "done" && !!p.dueDate && p.dueDate < now;
  const isOver = (p: Project) => !!p.budgetHours && p.hours > p.budgetHours;
  const shown = projects.filter(inView(view));

  return (
    <div className="shell page">
      <div className="page-head">
        <div>
          <h1>Projects</h1>
          <p>What is running, who works on it and what is next. Admins create projects; each lead assigns the work.</p>
        </div>
        {user.role === "admin" && (
          <Link href="/projects/new" className="btn btn-primary">
            <Plus size={16} strokeWidth={1.5} aria-hidden="true" /> New project
          </Link>
        )}
      </div>

      <ul className="stat-row" aria-label="Ongoing projects at a glance">
        <li className="stat card">
          <span className="stat-label">Ongoing projects</span>
          <span className="stat-value">{ongoing.length}</span>
        </li>
        <li className="stat card">
          <span className="stat-label">Overdue</span>
          <span className="stat-value">{ongoing.filter(isOverdue).length}</span>
        </li>
        <li className="stat card">
          <span className="stat-label">Over hour budget</span>
          <span className="stat-value">{ongoing.filter(isOver).length}</span>
        </li>
        <li className="stat card">
          <span className="stat-label">Open tasks</span>
          <span className="stat-value">{openTasks}</span>
        </li>
      </ul>

      <nav aria-label="Filter by status">
        <ul className="pills">
          {VIEWS.map((v) => (
            <li key={v.id}>
              <Link href={v.id === "ongoing" ? "/projects" : `/projects?view=${v.id}`} aria-current={v.id === view ? "page" : undefined}>
                {v.label} <span className="count">{projects.filter(inView(v.id)).length}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {shown.length === 0 ? (
        <p className="empty">
          {projects.length === 0
            ? user.role === "admin"
              ? "No projects yet. Create the first one with New project."
              : "No projects yet. An admin creates them."
            : "No projects with this status."}
        </p>
      ) : (
        <ul className="project-grid">
          {shown.map((p) => (
            <li key={p.id} className="project-card card">
              <div className="project-card-head">
                <h2>
                  <Link href={`/projects/${p.id}`}>{p.name}</Link>
                </h2>
                <span className={`tag${p.status === "active" ? " tag-strong" : ""}`}>{PROJECT_STATUS_LABEL[p.status]}</span>
              </div>
              {p.customer && <p className="project-customer">{p.customer}</p>}
              <dl className="facts">
                <div>
                  <dt>Lead</dt>
                  <dd>{p.leadName ?? "No lead yet"}</dd>
                </div>
                <div>
                  <dt>Contributors</dt>
                  <dd>{p.members.length ? p.members.map((m) => m.name).join(", ") : "None yet"}</dd>
                </div>
                <div>
                  <dt>Dates</dt>
                  <dd>
                    {p.startDate || p.dueDate ? (
                      <>
                        {p.startDate ? formatDate(p.startDate, year) : "No start"} → {p.dueDate ? formatDate(p.dueDate, year) : "no due date"}
                      </>
                    ) : (
                      "Not set"
                    )}
                    {isOverdue(p) && (
                      <span className="flag flag-danger">
                        <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" /> Overdue
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Tasks</dt>
                  <dd>
                    {p.openTasks} open · {p.doneTasks} done
                  </dd>
                </div>
              </dl>
              <BudgetMeter hours={p.hours} budget={p.budgetHours} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
