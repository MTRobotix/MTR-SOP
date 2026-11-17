import { expect, type Page } from "@playwright/test";
import { ADMIN } from "./env";

export async function signIn(page: Page, user: { email: string; password: string } = ADMIN): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("What do you need?");
}

export async function signOut(page: Page): Promise<void> {
  await page.locator('summary[aria-label^="Account"]').click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
}

/** "YYYY-MM-DD" in UTC, the time zone the tests pin (playwright.config.ts). */
export function isoDay(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** A home tile, by its heading. */
export function tile(page: Page, name: string | RegExp) {
  return page.locator("section.box").filter({ has: page.getByRole("heading", { name }) });
}
