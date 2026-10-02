import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listActivePeople } from "@/lib/work/projects";
import { createProjectAction } from "../actions";
import { ProjectForm } from "../ProjectForm";
import "@/components/work/work.css";
import "../projects.css";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireUser("admin");
  const people = await listActivePeople();
  return (
    <div className="shell page narrow">
      <div className="page-head">
        <div>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/projects">Projects</Link> <span aria-hidden="true">›</span>
          </nav>
          <h1>New project</h1>
          <p>Everyone can log hours on it once it exists. Add contributors and tasks on the project page.</p>
        </div>
      </div>
      <ProjectForm
        action={createProjectAction}
        people={people}
        submitLabel="Create project"
        values={{ name: "", customer: "", description: "", status: "active", leadId: null, budgetHours: null, startDate: null, dueDate: null }}
      />
    </div>
  );
}
