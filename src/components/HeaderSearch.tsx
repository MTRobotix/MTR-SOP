"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { SearchBox } from "./SearchBox";

/**
 * Search from any page. Button, "/" or Ctrl/Cmd+K:
 * - on the home page, focuses the page's search bar;
 * - elsewhere, opens a search dialog with the same suggestions. Enter goes to full results.
 */
export function HeaderSearch() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const openSearch = () => {
    const pageInput = pathname === "/" ? document.getElementById("sop-search") : null;
    if (pageInput) {
      window.scrollTo({ top: 0 });
      pageInput.focus();
      return;
    }
    setOpen(true);
  };

  // Shortcuts, unless the user is typing in a field or editor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable;
      const cmdK = e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey);
      if (cmdK || (e.key === "/" && !typing)) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Sync the native dialog with state; showModal gives focus trapping and Esc for free.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button type="button" className="btn btn-icon" aria-label="Search (/ or Ctrl+K)" title="Search (/ or Ctrl+K)" onClick={openSearch}>
        <Search size={18} strokeWidth={1.5} />
      </button>
      <dialog
        ref={dialogRef}
        className="search-dialog"
        aria-label="Search the SOP"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // Click on the dimmed backdrop (the dialog element itself) closes it.
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        {open && <SearchBox inputId="sop-search-dialog" autoFocus onNavigate={() => setOpen(false)} onEscape={() => setOpen(false)} />}
        <p className="search-dialog-hint">
          <kbd>Enter</kbd> full results and AI answer · <kbd>↑</kbd> <kbd>↓</kbd> pick a section · <kbd>Esc</kbd> close
        </p>
      </dialog>
    </>
  );
}
