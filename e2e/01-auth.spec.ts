import { expect, test } from "@playwright/test";
import { ADMIN } from "./env";
import { signIn, signOut } from "./helpers";

test.describe("sign-in", () => {
  test("a visitor without a session is sent to the login page and back after signing in", async ({ page }) => {
    await page.goto("/hours");
    await expect(page).toHaveURL(/\/login\?next=%2Fhours$/);
    await page.locator("#email").fill(ADMIN.email);
    await page.locator("#password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/hours$/);
    await expect(page.getByRole("heading", { level: 1, name: "Hours" })).toBeVisible();
  });

  test("the API refuses requests without a session", async ({ request }) => {
    const res = await request.get("/api/suggest?q=quote");
    expect(res.status()).toBe(401);
  });

  test("a wrong password shows one message and no session", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(ADMIN.email);
    await page.locator("#password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Wrong email or password.")).toBeVisible();
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("signing in opens home; signing out ends the session", async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hi, Erin. What do you need?");
    await signOut(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
