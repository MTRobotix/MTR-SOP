import { expect, test } from "@playwright/test";
import { signIn, tile } from "./helpers";

// Runs before any project, task or hour exists: the empty states.
test.describe("home", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("shows search first, one tile per area and the empty states", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator("#sop-search")).toBeVisible();

    const hours = tile(page, "Hours this week");
    await expect(hours.getByRole("img", { name: "0 h logged this week, on 0 of 7 days" })).toBeVisible();
    await expect(hours.locator(".day-row li")).toHaveCount(7);
    await expect(hours.locator(".ring circle")).toHaveCount(7);
    await expect(hours.locator(".ring-on")).toHaveCount(0);

    const projects = tile(page, "Projects");
    await expect(projects.locator(".big-figure")).toHaveText("0 ongoing");
    await expect(projects.getByText("overdue")).toHaveCount(0);

    const sop = tile(page, "New in the SOP");
    await expect(sop.locator(".recent-list a")).toHaveCount(3);
    await expect(sop.getByRole("link", { name: /^Browse all \d+ sections$/ })).toBeVisible();

    await expect(tile(page, "Your open tasks").getByText("No open tasks assigned to you.")).toBeVisible();
    await expect(page.getByRole("heading", { name: /In projects you lead/ })).toHaveCount(0);

    // One primary button per view (mtr-home-ui §6).
    await expect(page.locator("main .btn-primary")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Log hours for today" })).toHaveAttribute("href", "/hours");
  });

  test("search suggests sections while typing and Enter opens the results", async ({ page }) => {
    const input = page.locator("#sop-search");
    // Hovering a suggestion selects it, so park the pointer away from where the list opens.
    await page.mouse.move(0, 0);
    await input.fill("quote");
    // The last option is always "Search and ask AI"; sections come before it.
    const sections = page.locator(".search-option:not(.search-option-ask)");
    await expect(sections.first()).toBeVisible();
    await input.press("Enter");
    await expect(page).toHaveURL(/\/sop\?q=quote$/);
    await expect(page.getByRole("heading", { name: /sections? for “quote”/ })).toBeVisible();
  });

  test("a suggestion opens its section", async ({ page }) => {
    await page.locator("#sop-search").fill("sensq");
    const first = page.locator(".search-option:not(.search-option-ask)").first();
    await expect(first).toBeVisible();
    await first.click();
    await expect(page).toHaveURL(/\/d\/[a-z-]+\/[a-z0-9-]+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("a term typed before is answered from memory, with no new request", async ({ page }) => {
    const input = page.locator("#sop-search");
    const options = page.locator(".search-option:not(.search-option-ask)");
    let requests = 0;
    page.on("request", (r) => {
      if (r.url().includes("/api/suggest")) requests += 1;
    });
    await input.fill("quote");
    await expect(options.first()).toBeVisible();
    await expect.poll(() => requests).toBe(1);
    await input.fill("robot");
    await expect.poll(() => requests).toBe(2);
    await input.fill("quote");
    await expect(options.first()).toBeVisible();
    await page.waitForTimeout(400);
    expect(requests).toBe(2);
  });

  test('"/" focuses the search bar; old /?q= links still reach the results', async ({ page }) => {
    await page.locator("h1").click();
    await page.keyboard.press("/");
    await expect(page.locator("#sop-search")).toBeFocused();
    await page.goto("/?q=sensq");
    await expect(page).toHaveURL(/\/sop\?q=sensq$/);
  });

  test("the SOP tile leads to a section and to the SOP page", async ({ page }) => {
    const sop = tile(page, "New in the SOP");
    const first = sop.locator(".recent-list a").first();
    const title = (await first.textContent())!.trim();
    await first.click();
    await expect(page).toHaveURL(/\/d\/[a-z-]+\/[a-z0-9-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);

    await page.goto("/");
    await tile(page, "New in the SOP").getByRole("link", { name: /^Browse all/ }).click();
    await expect(page).toHaveURL(/\/sop$/);
    await expect(page.getByRole("heading", { level: 1, name: "Standard operating procedures" })).toBeVisible();
    await page.getByRole("heading", { level: 3 }).getByRole("link", { name: "Software" }).click();
    await expect(page).toHaveURL(/\/d\/software$/);
    await expect(page.getByRole("heading", { level: 1, name: "Software" })).toBeVisible();
  });

  test("the header reaches Hours and Projects, and the brand returns home", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "Hours" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Hours" })).toBeVisible();
    await nav.getByRole("link", { name: "Projects" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();
    await page.getByRole("link", { name: "MTR Home" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("What do you need?");
  });

  test("dark mode keeps the hero readable: its own navy, white text", async ({ page }) => {
    const hero = page.locator(".home-hero");
    await expect(hero).toHaveCSS("background-color", "rgb(61, 90, 128)");
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(hero).toHaveCSS("background-color", "rgb(36, 64, 107)");
    await expect(hero.getByRole("heading", { level: 1 })).toHaveCSS("color", "rgb(255, 255, 255)");
  });

  test("fits a 320 px phone with no sideways scroll, tiles stacked", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/");
    await expect(tile(page, "Hours this week")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const hero = await page.locator(".home-hero").boundingBox();
    const hours = await tile(page, "Hours this week").boundingBox();
    expect(hours!.y).toBeGreaterThan(hero!.y + hero!.height - 1);
  });

  test("home answers fast: greeting and search within 2 s, every tile within 3 s", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("#sop-search")).toBeVisible();
    expect(Date.now() - start).toBeLessThan(2000);
    await expect(page.locator('section.box[aria-busy="true"]')).toHaveCount(0);
    await expect(tile(page, "Your open tasks")).toBeVisible();
    expect(Date.now() - start).toBeLessThan(3000);
  });
});
