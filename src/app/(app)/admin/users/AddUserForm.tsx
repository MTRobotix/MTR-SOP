"use client";

import { useActionState } from "react";
import { addUser, type ActionState } from "./actions";
import { MIN_PASSWORD } from "@/lib/auth/roles";

export function AddUserForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(addUser, {});
  return (
    <form action={action} className="card admin-form">
      <h2 className="side-title">Add user</h2>
      <div className="admin-form-grid">
        <div>
          <label className="label" htmlFor="u-email">Email</label>
          <input className="input" id="u-email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="u-name">Name</label>
          <input className="input" id="u-name" name="name" required />
        </div>
        <div>
          <label className="label" htmlFor="u-pass">Temporary password</label>
          <input className="input" id="u-pass" name="password" type="text" minLength={MIN_PASSWORD} required autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="u-role">Role</label>
          <select className="input" id="u-role" name="role" defaultValue="viewer">
            <option value="viewer">Viewer — read</option>
            <option value="editor">Editor — edits go to review</option>
            <option value="admin">Admin — edits go live, approves, manages users</option>
          </select>
        </div>
      </div>
      {state.error && <p className="notice notice-error" role="alert">{state.error}</p>}
      {state.ok && <p className="notice" role="status">{state.ok}</p>}
      <div>
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Adding…" : "Add user"}</button>
      </div>
    </form>
  );
}
