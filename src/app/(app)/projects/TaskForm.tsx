"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import type { Person } from "@/lib/work/projects";
import { TASK_STATUSES, TASK_STATUS_LABEL, type TaskStatus } from "@/lib/work/shared";
import type { FormState } from "./actions";

type Values = { id?: number; title: string; notes: string; status: TaskStatus; assigneeId: number | null; dueDate: string | null };

type Props = {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  projectId: number;
  members: Person[];
  values?: Values;
  /** Compact one-line form above the board, or the full form on the task page. */
  compact?: boolean;
};

const EMPTY: Values = { title: "", notes: "", status: "todo", assigneeId: null, dueDate: null };

export function TaskForm({ action, projectId, members, values = EMPTY, compact = false }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const p = compact ? "nt" : "et";
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (compact && state.ok) formRef.current?.reset();
  }, [compact, state]);
  return (
    <form
      ref={formRef}
      className={compact ? "task-add card" : "card form-card"}
      onSubmit={(e) => {
        // Submit by hand: a form action resets every field afterwards, which would wipe the input when the server says no.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      {values.id && <input type="hidden" name="taskId" value={values.id} />}
      <div className={compact ? "task-add-fields" : "form-grid"}>
        <div className={compact ? "task-add-title" : "span-2"}>
          <label className="label" htmlFor={`${p}-title`}>
            {compact ? "New task" : "Task"}
          </label>
          <input className="input" id={`${p}-title`} name="title" defaultValue={values.title} maxLength={120} required placeholder="What needs doing" />
        </div>
        <div>
          <label className="label" htmlFor={`${p}-assignee`}>
            Assignee
          </label>
          <select className="input" id={`${p}-assignee`} name="assigneeId" defaultValue={values.assigneeId ?? ""}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`${p}-due`}>
            Due <span className="hint">optional</span>
          </label>
          <input className="input" id={`${p}-due`} name="dueDate" type="date" defaultValue={values.dueDate ?? ""} />
        </div>
        {!compact && (
          <>
            <div>
              <label className="label" htmlFor={`${p}-status`}>
                Status
              </label>
              <select className="input" id={`${p}-status`} name="status" defaultValue={values.status}>
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TASK_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="span-2">
              <label className="label" htmlFor={`${p}-notes`}>
                Notes <span className="hint">optional</span>
              </label>
              <textarea className="input" id={`${p}-notes`} name="notes" rows={5} maxLength={2000} defaultValue={values.notes} />
            </div>
          </>
        )}
        <div className={compact ? "task-add-submit" : "form-actions span-2"}>
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Saving…" : compact ? "Add task" : "Save task"}
          </button>
        </div>
      </div>
      {compact && members.length === 0 && <p className="hint">Add contributors below to assign tasks to them.</p>}
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="notice" role="status">
          {state.ok}
        </p>
      )}
    </form>
  );
}
