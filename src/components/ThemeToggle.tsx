"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

const getTheme = () => document.documentElement.dataset.theme ?? "light";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="btn btn-icon"
      aria-label={`Switch to ${next} theme`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("sop-theme", next);
        } catch {
          /* private mode: theme still applies for this page */
        }
      }}
    >
      {theme === "dark" ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
    </button>
  );
}
