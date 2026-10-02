import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleAlert, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { canManage, getProject } from "@/lib/work/projects";
import { getTask } from "@/lib/work/tasks";
import { today } from "@/lib/work/today";
import { formatDate, TASK_STATUS_LABEL } from "@/lib/work/shared";
import { deleteTaskAction, updateTaskAction } from "../../../actions";
import { TaskForm } from "../../../TaskForm";
import { TaskStatusSelect } from "../../../TaskStatusSelect";
import { ConfirmButton } from "../../../ConfirmButton";
import "@/components/work/work.css";
import "../../../projects.css";

type P = { params: Promise<{ id: string; taskId: string }> };

export async function generateMetadata({ params }: P) {
  const task = await getTask(Number((await params).taskId));
  return { title: task?.title ?? "Not found" };
}

export default async function TaskPage({ params }: P) {
  const user = await requireUser();
  const { id, taskId } = await params;
  const [project, task] = await Promise.all([getProject(Number(id)), getTask(Number(taskId))]);
  if (!project || !task || task.projectId !== project.id) notFound();
  const manage = canManage(user, project);
  const now = today();
  const year = now.slice(0, 4);
  const late = task.status !== "done" && !!task.dueDate && task.dueDate < now;

  return (
    <div className="shell page narrow">
      <div className="page-head">
        <div>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/projects">Projects</Link> <span aria-hidden="true">›</span> <Link href={`/projects/${project.id}`}>{project.name}</Link>
          </nav>
          <h1>{task.title}</h1>
        </div>
      </div>

      <dl className="facts facts-row card">
        <div>
          <dt>Status</dt>
          <dd>{TASK_STATUS_LABEL[task.status]}</dd>
        </div>
        <div>
          <dt>Assignee</dt>
          <dd>{task.assigneeName ?? "Unassigned"}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>
            {task.dueDate ? formatDate(task.dueDate, year) : "Not set"}
            {late && (
              <span className="flag flag-danger">
                <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" /> Overdue
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>Created by</dt>
          <dd>{task.createdByName ?? "Unknown"}</dd>
        </div>
      </dl>

      {manage ? (
        <>
          <h2 className="block-title">Edit task</h2>
          <TaskForm
            action={updateTaskAction}
            projectId={project.id}
            members={project.members}
            values={{ id: task.id, title: task.title, notes: task.notes, status: task.status, assigneeId: task.assigneeId, dueDate: task.dueDate }}
          />
          <form action={deleteTaskAction} className="danger-zone">
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="taskId" value={task.id} />
            <div>
              <h2 className="card-title">Delete task</h2>
              <p className="hint">Removes it from the board. Hours logged on the project stay.</p>
            </div>
            <ConfirmButton className="btn btn-danger" message={`Delete “${task.title}”?`}>
              <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" /> Delete task
            </ConfirmButton>
          </form>
        </>
      ) : (
        <>
          <h2 className="block-title">Notes</h2>
          <p className="task-notes">{task.notes || "No notes."}</p>
          {task.assigneeId === user.id && (
            <div className="task-move">
              <span className="label">Move this task</span>
              <TaskStatusSelect taskId={task.id} status={task.status} label={task.title} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
