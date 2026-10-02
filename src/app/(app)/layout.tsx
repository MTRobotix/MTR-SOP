import { requireUser } from "@/lib/auth/session";
import { Header } from "@/components/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <Header user={user} />
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="shell">MTR Home · SOP source of truth: <code>content/</code> on <code>main</code></div>
      </footer>
    </>
  );
}
