import { requireUser } from "@/lib/auth/session";
import { listUsers } from "@/lib/auth/users";
import { ROLES, MIN_PASSWORD } from "@/lib/auth/roles";
import { updateUser } from "./actions";
import { AddUserForm } from "./AddUserForm";
import "../admin.css";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireUser("admin");
  const users = await listUsers();
  return (
    <div className="shell page">
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p>Viewers read. Editors propose changes. Admins publish, review and manage users.</p>
        </div>
      </div>
      <AddUserForm />
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Reset password</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const self = u.id === me.id;
              return (
                <tr key={u.id}>
                  <td>{u.name}{self && <span className="tag">you</span>}</td>
                  <td>{u.email}</td>
                  <td>
                    <form action={updateUser} className="inline-form">
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="op" value="role" />
                      <select className="input input-sm" name="role" defaultValue={u.role} disabled={self} aria-label={`Role for ${u.email}`}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {!self && <button className="btn btn-sm" type="submit">Set</button>}
                    </form>
                  </td>
                  <td>
                    {self ? (
                      "Active"
                    ) : (
                      <form action={updateUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="op" value={u.disabled ? "enable" : "disable"} />
                        <button className={`btn btn-sm${u.disabled ? "" : " btn-danger"}`} type="submit">{u.disabled ? "Enable" : "Disable"}</button>
                      </form>
                    )}
                    {u.disabled && <span className="tag">disabled</span>}
                  </td>
                  <td>
                    {self ? (
                      <a href="/account">Change on Account page</a>
                    ) : (
                    <form action={updateUser} className="inline-form">
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="op" value="password" />
                      <input className="input input-sm" name="password" type="text" minLength={MIN_PASSWORD} placeholder="New temporary password" aria-label={`New password for ${u.email}`} autoComplete="off" required />
                      <button className="btn btn-sm" type="submit">Reset</button>
                    </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
