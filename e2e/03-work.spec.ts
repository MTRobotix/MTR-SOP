import { expect, test } from "@playwright/test";
import { signIn, isoDay, tile } from "./helpers";

// One story, in order: a project, hours on it, tasks in it. Home must follow each step.
test.describe.serial("projects, hours and tasks reach home", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("a new project that is past due shows as ongoing and overdue", async ({ page }) => {
    await page.goto("/projects/new");
    await page.locator("#p-name").fill("E2E Pilot");
    await page.locator("#p-lead").selectOption({ label: "Erin Tester" });
    await page.locator("#p-due").fill(isoDay(-1));
    await page.locator("form button[type=submit].btn-primary").click();
    await expect(page).toHaveURL(/\/projects\/\d+$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("E2E Pilot");

    await page.goto("/");
    const projects = tile(page, "Projects");
    await expect(projects.locator(".big-figure")).toHaveText("1 ongoing");
    await expect(projects.locator(".flag-danger")).toHaveText("1 overdue · P-001");
    await projects.getByRole("link", { name: "Open projects" }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByText("E2E Pilot").first()).toBeVisible();
  });

  test("hours logged today fill the ring and the day row", async ({ page }) => {
    await page.getByRole("link", { name: "Log hours for today" }).click();
    await expect(page).toHaveURL(/\/hours$/);
    const value = await page.locator("#log-project option", { hasText: "E2E Pilot" }).getAttribute("value");
    await page.locator("#log-project").selectOption(value!);
    await page.locator("#log-hours").fill("2.5");
    await page.locator(".log-submit").click();
    await expect(page.getByRole("status").filter({ hasText: "Logged 2.5 h" })).toBeVisible();

    await page.goto("/");
    const hours = tile(page, "Hours this week");
    await expect(hours.getByRole("img", { name: "2.5 h logged this week, on 1 of 7 days" })).toBeVisible();
    await expect(hours.locator(".ring-on")).toHaveCount(1);
    const day = hours.getByRole("link", { name: /: 2\.5 h$/ });
    await expect(day).toHaveCount(1);
    await day.click();
    await expect(page).toHaveURL(new RegExp(`/hours\\?day=${isoDay()}$`));
    await expect(page.getByText("E2E Pilot").first()).toBeVisible();
  });

  test("a task assigned to me appears on home, overdue, and opens", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("link", { name: /E2E Pilot/ }).first().click();
    await expect(page).toHaveURL(/\/projects\/\d+$/);
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Add task" }) });
    await form.locator('input[name="title"]').fill("Fix the conveyor sensor");
    await form.locator('select[name="assigneeId"]').selectOption({ label: "Erin Tester" });
    await form.locator('input[name="dueDate"]').fill(isoDay(-2));
    await form.getByRole("button", { name: "Add task" }).click();
    await expect(page.getByText("Fix the conveyor sensor").first()).toBeVisible();

    await page.goto("/");
    const mine = tile(page, /Your open tasks/);
    await expect(mine.getByRole("heading")).toHaveText("Your open tasks · 1");
    const row = mine.getByRole("link", { name: /Fix the conveyor sensor/ });
    await expect(row).toContainText("P-001");
    await expect(row).toContainText("Overdue");
    await row.click();
    await expect(page).toHaveURL(/\/projects\/\d+\/tasks\/\d+$/);
    await expect(page.getByText("Fix the conveyor sensor").first()).toBeVisible();
  });

  test("an unassigned task in a project I lead appears under its own heading", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("link", { name: /E2E Pilot/ }).first().click();
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Add task" }) });
    await form.locator('input[name="title"]').fill("Order lighting samples");
    await form.locator('input[name="dueDate"]').fill(isoDay(10));
    await form.getByRole("button", { name: "Add task" }).click();
    await expect(page.getByText("Order lighting samples").first()).toBeVisible();

    await page.goto("/");
    const led = tile(page, /In projects you lead/);
    const row = led.getByRole("link", { name: /Order lighting samples/ });
    await expect(row).toContainText("Unassigned");
    await expect(row).toContainText("Due ");
    await expect(tile(page, /Your open tasks/).getByRole("link")).toHaveCount(1);
  });
});
