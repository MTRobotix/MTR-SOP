import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { canManage, getProject, listActivePeople } from "@/lib/work/projects";
import { deleteProjectAction, updateProjectAction } from "../../actions";
import { ProjectForm } from "../../ProjectForm";
import { ConfirmButton } from "../../ConfirmButton";
import "@/components/work/work.css";
import "../../projects.css";

export const metadata = { title: "Edit project" };

type P = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; error?: string }> };

export default async function EditProjectPage({ params, searchParams }: P) {
  const user = await requireUser();
  const project = await getProject(Number((await params).id));
  if (!project) notFound();
  if (!canManage(user, project)) redirect("/forbidden");
  const { created, error } = await searchParams;
  const admin = user.role === "admin";
  const people = await listActivePeople();

  return (
    <div className="shell page narrow">
      <div className="page-head">
        <div>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/projects">Projects</Link> <span aria-hidden="true">›</span> <Link href={`/projects/${project.id}`}>{project.name}</Link>
          </nav>
          <h1>Edit project</h1>
        </div>
      </div>
      {created && (
        <p className="notice" role="status" style={{ marginBottom: "var(--space-4)" }}>
          Created from a typed name, with its hours. Add a customer, lead and dates.
        </p>
      )}
      {error && (
        <p className="notice notice-error" role="alert" style={{ marginBottom: "var(--space-4)" }}>
          {error}
        </p>
      )}
      <ProjectForm action={updateProjectAction} people={people} lead={!admin} submitLabel="Save project" values={project} />

      {admin && (
        <form action={deleteProjectAction} className="danger-zone">
          <input type="hidden" name="projectId" value={project.id} />
          <div>
            <h2 className="card-title">Delete project</h2>
            <p className="hint">Deletes the project and its tasks. Only possible while nobody has logged hours on it; otherwise set it to Done.</p>
          </div>
          <ConfirmButton className="btn btn-danger" message={`Delete ${project.name} and its ${project.openTasks + project.doneTasks} tasks?`}>
            <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" /> Delete project
          </ConfirmButton>
        </form>
      )}
    </div>
  );
}
