import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/prose.css";

export const metadata: Metadata = {
  title: { default: "MTR Home", template: "%s · MTR Home" },
  description: "MTR standard operating procedures, hours and projects.",
  robots: { index: false, follow: false },
};

// Sets the theme before first paint so there is no light/dark flash.
const THEME_SCRIPT = `try{var t=localStorage.getItem("sop-theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
