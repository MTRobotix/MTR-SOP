"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TZ_COOKIE } from "@/lib/work/shared";

/**
 * Keeps the tz cookie on the browser's time zone, so the server's "today" is the person's own day
 * (Toronto and Ho Chi Minh City are 11 hours apart). When it changes, the page renders again once.
 */
export function TimeZoneCookie() {
  const router = useRouter();
  useEffect(() => {
    let zone = "";
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!/^[\w+\-/]+$/.test(zone)) return;
    const read = () =>
      document.cookie
        .split("; ")
        .find((c) => c.startsWith(`${TZ_COOKIE}=`))
        ?.slice(TZ_COOKIE.length + 1);
    if (read() === zone) return;
    document.cookie = `${TZ_COOKIE}=${zone}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
    // Only when the browser kept it, so blocked cookies never cause a refresh loop.
    if (read() === zone) router.refresh();
  }, [router]);
  return null;
}
