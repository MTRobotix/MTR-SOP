"use client";

import { startTransition, useActionState } from "react";
import type { Person } from "@/lib/work/projects";
import { PROJECT_STATUSES, PROJECT_STATUS_LABEL, type ProjectStatus } from "@/lib/work/shared";
import type { FormState } from "./actions";

export type ProjectValues = {
  id?: number;
  name: string;
  customer: string;
  description: string;
  status: ProjectStatus;
  leadId: number | null;
  budgetHours: number | null;
  startDate: string | null;
  dueDate: string | null;
};

type Props = {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  values: ProjectValues;
  people: Person[];
  /** Leads edit description, status and dates; the rest is set by an admin. */
  lead?: boolean;
  submitLabel: string;
};

export function ProjectForm({ action, values, people, lead = false, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  return (
    <form
      className="card form-card"
      onSubmit={(e) => {
        // Submit by hand: a form action resets every field afterwards, which would wipe the input when the server says no.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      {values.id && <input type="hidden" name="projectId" value={values.id} />}
      {lead && <p className="hint">Name, customer, lead and hour budget are set by an admin.</p>}
      <div className="form-grid">
        <div>
          <label className="label" htmlFor="p-name">
            Name
          </label>
          <input className="input" id="p-name" name="name" defaultValue={values.name} maxLength={80} required disabled={lead} />
        </div>
        <div>
          <label className="label" htmlFor="p-customer">
            Customer <span className="hint">optional</span>
          </label>
          <input className="input" id="p-customer" name="customer" defaultValue={values.customer} maxLength={80} disabled={lead} />
        </div>
        <div>
          <label className="label" htmlFor="p-status">
            Status
          </label>
          <select className="input" id="p-status" name="status" defaultValue={values.status}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="p-lead">
            Lead
          </label>
          <select className="input" id="p-lead" name="leadId" defaultValue={values.leadId ?? ""} disabled={lead}>
            <option value="">No lead yet</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {!lead && <p className="hint">The lead assigns tasks and manages contributors.</p>}
        </div>
        <div>
          <label className="label" htmlFor="p-start">
            Start date <span className="hint">optional</span>
          </label>
          <input className="input" id="p-start" name="startDate" type="date" defaultValue={values.startDate ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="p-due">
            Due date <span className="hint">optional</span>
          </label>
          <input className="input" id="p-due" name="dueDate" type="date" defaultValue={values.dueDate ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="p-budget">
            Hour budget <span className="hint">optional</span>
          </label>
          <input
            className="input"
            id="p-budget"
            name="budgetHours"
            inputMode="decimal"
            defaultValue={values.budgetHours ?? ""}
            placeholder="e.g. 120"
            disabled={lead}
          />
          {!lead && <p className="hint">Total hours planned. The dashboard compares it with the hours logged.</p>}
        </div>
        <div className="span-2">
          <label className="label" htmlFor="p-desc">
            Description <span className="hint">optional</span>
          </label>
          <textarea className="input" id="p-desc" name="description" rows={4} maxLength={2000} defaultValue={values.description} />
        </div>
      </div>
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
