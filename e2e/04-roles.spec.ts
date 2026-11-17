import { expect, test } from "@playwright/test";
import { VIEWER } from "./env";
import { signIn, signOut, tile } from "./helpers";

test.describe.serial("roles", () => {
  test("an admin adds a viewer", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/users");
    await page.locator("#u-email").fill(VIEWER.email);
    await page.locator("#u-name").fill(VIEWER.name);
    await page.locator("#u-pass").fill(VIEWER.password);
    await page.getByRole("button", { name: "Add user" }).click();
    await expect(page.getByText(VIEWER.email).first()).toBeVisible();
    await signOut(page);
  });

  test("a viewer gets their own home, reads the SOP, and is kept out of admin pages", async ({ page }) => {
    await signIn(page, VIEWER);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hi, Vera. What do you need?");
    // Hours and tasks are the viewer's own, not the admin's; project counts are shared.
    await expect(tile(page, "Hours this week").getByRole("img", { name: /^0 h logged/ })).toBeVisible();
    await expect(tile(page, /Your open tasks/).getByText("No open tasks assigned to you.")).toBeVisible();
    await expect(tile(page, "Projects").locator(".big-figure")).toHaveText("1 ongoing");

    await page.goto("/d/software");
    await expect(page.getByRole("heading", { level: 1, name: "Software" })).toBeVisible();

    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { level: 1, name: "No access" })).toBeVisible();
  });
});
