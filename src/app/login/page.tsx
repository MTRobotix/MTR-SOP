import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";
import "./login.css";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { next = "/" } = await searchParams;
  return (
    <main className="login">
      <div className="login-card card fade-in">
        <p className="login-brand">
          MTR <span>HOME</span>
        </p>
        <h1>Sign in</h1>
        <p className="login-lead">SOP, hours and projects for MTR staff.</p>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
