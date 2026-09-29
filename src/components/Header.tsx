"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Menu, X, UserRound } from "lucide-react";
import type { User } from "@/lib/auth/roles";
import { ThemeToggle } from "./ThemeToggle";
import { HeaderSearch } from "./HeaderSearch";
import "./Header.css";

type Props = { user: User; depts: { id: string; title: string }[] };

export function Header({ user, depts }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDetailsElement>(null);

  const closeMenus = () => {
    setOpen(false);
    menuRef.current?.removeAttribute("open");
  };

  const isActive = (id: string) => pathname === `/d/${id}` || pathname.startsWith(`/d/${id}/`);

  return (
    <header className="site-header">
      <div className="header-inner glass">
        <Link href="/" className="brand" aria-label="MTR SOP home" onClick={closeMenus}>
          MTR <span className="brand-sop">SOP</span>
        </Link>

        <nav aria-label="Departments" className={`header-nav${open ? " is-open" : ""}`} id="header-nav">
          {depts.map((d) => (
            <Link key={d.id} href={`/d/${d.id}`} aria-current={isActive(d.id) ? "page" : undefined} onClick={closeMenus}>
              {d.title}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <HeaderSearch />
          <ThemeToggle />
          <details className="user-menu" ref={menuRef}>
            <summary className="btn btn-icon" aria-label={`Account: ${user.name}`}>
              <UserRound size={18} strokeWidth={1.5} />
            </summary>
            <div className="user-menu-panel glass-panel" onClick={closeMenus}>
              <p className="user-menu-name">{user.name}</p>
              <p className="hint">
                {user.email} · {user.role}
              </p>
              <hr />
              <Link href="/account">Change password</Link>
              {user.role === "admin" && (
                <>
                  <Link href="/admin/reviews">Review edits</Link>
                  <Link href="/admin/users">Users</Link>
                </>
              )}
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="linklike">
                  Sign out
                </button>
              </form>
            </div>
          </details>
          <button
            type="button"
            className="btn btn-icon menu-toggle"
            aria-expanded={open}
            aria-controls="header-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>
    </header>
  );
}
