"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import "./Search.css";

type Item = { id: string; heading: string; docTitle: string; deptTitle: string; href: string };

type Props = {
  initial?: string;
  /** Input id; the header's "/" shortcut focuses #sop-search on the SOP page. */
  inputId?: string;
  autoFocus?: boolean;
  /** Called before navigating away, e.g. to close the header search dialog. */
  onNavigate?: () => void;
  /** Called on Esc when no suggestions are open, e.g. to close the header search dialog. */
  onEscape?: () => void;
};

export function SearchBox({ initial = "", inputId = "sop-search", autoFocus = false, onNavigate, onEscape }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) {
          setItems(((await res.json()) as { items: Item[] }).items);
          setActive(-1);
        }
      } catch {
        /* aborted or offline: keep previous suggestions */
      }
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  const submit = () => {
    const term = q.trim();
    go(term ? `/sop?q=${encodeURIComponent(term)}` : "/sop");
  };

  const showPopup = open && q.trim().length >= 2;
  // Suggestions only apply to 2+ characters; shorter input shows none.
  const shown = q.trim().length >= 2 ? items : [];

  return (
    <form
      role="search"
      className="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && shown[active]) go(shown[active].href);
        else submit();
      }}
    >
      <label htmlFor={inputId} className="visually-hidden">
        Search the SOP
      </label>
      <div className="search-bar">
        <Search size={18} strokeWidth={1.5} aria-hidden="true" className="search-icon" />
        <input
          ref={inputRef}
          id={inputId}
          autoFocus={autoFocus}
          className="search-input"
          type="search"
          placeholder="Search procedures — e.g. run SensQ, reset Postgres, quote"
          autoComplete="off"
          value={q}
          role="combobox"
          aria-expanded={showPopup}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, shown.length));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, -1));
            } else if (e.key === "Escape" && showPopup) {
              // First Esc closes the popup; the browser's clear-on-Esc applies only when it is closed.
              e.preventDefault();
              setOpen(false);
              setActive(-1);
            } else if (e.key === "Escape" && onEscape) {
              e.preventDefault();
              onEscape();
            }
          }}
        />
        <kbd className="search-kbd" aria-hidden="true">
          /
        </kbd>
      </div>

      {showPopup && (
        <ul id={listId} role="listbox" className="search-popup">
          {shown.map((it, i) => (
            <li
              key={it.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className="search-option"
              onMouseDown={(e) => {
                e.preventDefault();
                go(it.href);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="search-option-title">{it.heading}</span>
              <span className="search-option-meta">
                {it.deptTitle} › {it.docTitle}
              </span>
            </li>
          ))}
          <li
            id={`${listId}-${shown.length}`}
            role="option"
            aria-selected={active === shown.length}
            className="search-option search-option-ask"
            onMouseDown={(e) => {
              e.preventDefault();
              submit();
            }}
            onMouseEnter={() => setActive(shown.length)}
          >
            <span className="search-option-title">
              Search and ask AI: “{q.trim()}”
            </span>
            <CornerDownLeft size={14} strokeWidth={1.5} aria-hidden="true" />
          </li>
        </ul>
      )}
    </form>
  );
}
