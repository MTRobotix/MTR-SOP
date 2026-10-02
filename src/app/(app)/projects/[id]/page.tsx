import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleAlert, Pencil, Plus, X } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { canManage, getProject, listActivePeople, projectHoursByPerson } from "@/lib/work/projects";
import { listTasks } from "@/lib/work/tasks";
import { today } from "@/lib/work/today";
import { formatDate, formatHours, PROJECT_STATUS_LABEL, TASK_STATUSES, TASK_STATUS_LABEL } from "@/lib/work/shared";
import { BudgetMeter } from "@/components/work/Meter";
import { addMemberAction, addTaskAction, removeMemberAction } from "../actions";
import { TaskForm } from "../TaskForm";
import { TaskStatusSelect } from "../TaskStatusSelect";
import { ConfirmButton } from "../ConfirmButton";
import "@/components/work/work.css";
import "../projects.css";

type P = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: P) {
  const project = await getProject(Number((await params).id));
  return { title: project?.name ?? "Not found" };
}

export default async function ProjectPage({ params }: P) {
  const user = await requireUser();
  const project = await getProject(Number((await params).id));
  if (!project) notFound();
  const manage = canManage(user, project);
  const admin = user.role === "admin";
  const [tasks, people, byPerson] = await Promise.all([
    listTasks(project.id),
    manage ? listActivePeople() : Promise.resolve([]),
    admin ? projectHoursByPerson(project.id) : Promise.resolve([]),
  ]);
  const now = today();
  const year = now.slice(0, 4);
  const memberIds = new Set(project.members.map((m) => m.id));
  const addable = people.filter((p) => !memberIds.has(p.id));
  const overdue = project.status !== "done" && !!project.dueDate && project.dueDate < now;

  return (
    <div className="shell page">
      <div className="page-head">
        <div>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/projects">Projects</Link> <span aria-hidden="true">›</span>
          </nav>
          <h1>{project.name}</h1>
          <p className="project-sub">
            <span className={`tag${project.status === "active" ? " tag-strong" : ""}`}>{PROJECT_STATUS_LABEL[project.status]}</span>
            {project.customer && <span>{project.customer}</span>}
          </p>
        </div>
        {manage && (
          <Link href={`/projects/${project.id}/edit`} className="btn">
            <Pencil size={16} strokeWidth={1.5} aria-hidden="true" /> Edit project
          </Link>
        )}
      </div>

      <div className="project-top">
        <dl className="facts facts-row card">
          <div>
            <dt>Lead</dt>
            <dd>{project.leadName ?? "No lead yet"}</dd>
          </div>
          <div>
            <dt>Start</dt>
            <dd>{project.startDate ? formatDate(project.startDate, year) : "Not set"}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>
              {project.dueDate ? formatDate(project.dueDate, year) : "Not set"}
              {overdue && (
                <span className="flag flag-danger">
                  <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" /> Overdue
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>Tasks</dt>
            <dd>
              {project.openTasks} open · {project.doneTasks} done
            </dd>
          </div>
        </dl>
        <div className="card budget-card">
          <p className="facts-title">Hours logged</p>
          <BudgetMeter hours={project.hours} budget={project.budgetHours} />
        </div>
      </div>

      {project.description && <p className="project-desc">{project.description}</p>}

      <section aria-labelledby="tasks-title" className="board-section">
        <h2 id="tasks-title" className="block-title">
          Tasks
        </h2>
        {manage && <TaskForm action={addTaskAction} projectId={project.id} members={project.members} compact />}
        <div className="board">
          {TASK_STATUSES.map((s) => {
            const col = tasks.filter((t) => t.status === s);
            return (
              <section key={s} className="board-col" aria-labelledby={`col-${s}`}>
                <h3 id={`col-${s}`}>
                  {TASK_STATUS_LABEL[s]} <span className="count">{col.length}</span>
                </h3>
                {col.length === 0 ? (
                  <p className="board-empty">No tasks.</p>
                ) : (
                  <ul>
                    {col.map((t) => {
                      const late = s !== "done" && !!t.dueDate && t.dueDate < now;
                      return (
                        <li key={t.id} className="task-card">
                          <Link href={`/projects/${project.id}/tasks/${t.id}`} className="task-card-title">
                            {t.title}
                          </Link>
                          <p className="task-card-meta">
                            <span>{t.assigneeName ?? "Unassigned"}</span>
                            {t.dueDate &&
                              (late ? (
                                <span className="flag flag-danger">
                                  <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" /> Overdue · {formatDate(t.dueDate, year)}
                                </span>
                              ) : (
                                <span>Due {formatDate(t.dueDate, year)}</span>
                              ))}
                          </p>
                          {(manage || t.assigneeId === user.id) && <TaskStatusSelect taskId={t.id} status={t.status} label={t.title} />}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </section>

      <div className="project-bottom">
        <section className="card form-card" aria-labelledby="people-title">
          <h2 id="people-title" className="card-title">
            Contributors
          </h2>
          {project.members.length === 0 ? (
            <p className="hint">Nobody yet.{manage ? " Add the people who work on this project." : ""}</p>
          ) : (
            <ul className="people">
              {project.members.map((m) => (
                <li key={m.id}>
                  <span>
                    {m.name}
                    {m.id === project.leadId && <span className="tag">lead</span>}
                    {m.id === user.id && <span className="tag">you</span>}
                  </span>
                  {manage && m.id !== project.leadId && (
                    <form action={removeMemberAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="userId" value={m.id} />
                      <ConfirmButton
                        className="btn btn-icon people-remove"
                        aria-label={`Remove ${m.name}`}
                        message={`Remove ${m.name}? Their open tasks here become unassigned.`}
                      >
                        <X size={16} strokeWidth={1.5} />
                      </ConfirmButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
          {manage && addable.length > 0 && (
            <form action={addMemberAction} className="inline-form people-add">
              <input type="hidden" name="projectId" value={project.id} />
              <label className="visually-hidden" htmlFor="add-person">
                Person to add
              </label>
              <select className="input" id="add-person" name="userId" required defaultValue="">
                <option value="" disabled>
                  Pick a person…
                </option>
                {addable.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button className="btn" type="submit">
                <Plus size={16} strokeWidth={1.5} aria-hidden="true" /> Add
              </button>
            </form>
          )}
        </section>

        {admin && (
          <section className="card form-card" aria-labelledby="hours-title">
            <h2 id="hours-title" className="card-title">
              Hours by person
            </h2>
            {byPerson.length === 0 ? (
              <p className="hint">No hours logged on this project yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Person</th>
                    <th scope="col" className="num">
                      Hours
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {byPerson.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/hours/team?user=${r.id}&project=${project.id}&from=2000-01-01&to=${now}`}>{r.name}</Link>
                      </td>
                      <td className="num">{formatHours(r.hours)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="hint">Only admins see this. Everyone else sees the project total.</p>
          </section>
        )}
      </div>
    </div>
  );
}
