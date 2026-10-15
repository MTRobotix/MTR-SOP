"use client";

import { useSyncExternalStore } from "react";

const pad = (n: number) => String(n).padStart(2, "0");
const noop = () => () => {};

/** Server renders UTC; in the browser the same element shows the viewer's local time. */
export function LocalTime({ iso }: { iso: string }) {
  const inBrowser = useSyncExternalStore(noop, () => true, () => false);
  const d = new Date(iso);
  const text = inBrowser
    ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    : `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
  return <time dateTime={iso}>{text}</time>;
}
