import { requireUser } from "@/lib/auth/session";
import { listDepartments } from "@/lib/content/repo";
import { Header } from "@/components/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const depts = await listDepartments();
  return (
    <>
      <Header user={user} depts={depts.map((d) => ({ id: d.id, title: d.meta.title }))} />
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="shell">MTR SOP · Source of truth: <code>content/</code> on <code>main</code></div>
      </footer>
    </>
  );
}
