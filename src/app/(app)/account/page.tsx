import { requireUser } from "@/lib/auth/session";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="shell page">
      <div className="page-head">
        <div>
          <h1>Account</h1>
          <p>{user.name} · {user.email} · {user.role}</p>
        </div>
      </div>
      <div style={{ maxWidth: "28rem" }}>
        <PasswordForm />
      </div>
    </div>
  );
}
