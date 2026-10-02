"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Menu, X, UserRound } from "lucide-react";
import type { User } from "@/lib/auth/roles";
import { ThemeToggle } from "./ThemeToggle";
import { HeaderSearch } from "./HeaderSearch";
import "./Header.css";

type Props = { user: User };

// The three areas. "match" lists the path prefixes that count as being inside the area.
const AREAS = [
  { href: "/sop", label: "SOP", match: ["/sop", "/d/"] },
  { href: "/hours", label: "Hours", match: ["/hours"] },
  { href: "/projects", label: "Projects", match: ["/projects"] },
];

export function Header({ user }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDetailsElement>(null);

  const closeMenus = () => {
    setOpen(false);
    menuRef.current?.removeAttribute("open");
  };

  const isActive = (match: string[]) => match.some((m) => pathname === m || pathname.startsWith(m.endsWith("/") ? m : `${m}/`));

  return (
    <header className="site-header">
      <div className="header-inner glass">
        <Link href="/" className="brand" aria-label="MTR Home" onClick={closeMenus}>
          MTR <span className="brand-sub">HOME</span>
        </Link>

        <nav aria-label="Main" className={`header-nav${open ? " is-open" : ""}`} id="header-nav">
          {AREAS.map((a) => (
            <Link key={a.href} href={a.href} aria-current={isActive(a.match) ? "page" : undefined} onClick={closeMenus}>
              {a.label}
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
                  <Link href="/hours/team">Team hours</Link>
                  <Link href="/admin/reviews">Review SOP edits</Link>
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
