import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("health endpoint reports the database", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toMatchObject({ ok: true, db: "up" });
});

test("signed-out visitors land on the passkey login", async ({ page }) => {
  await page.goto("/body");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Formkoll" })).toBeVisible();
  await expect(page.getByRole("button", { name: /passkey/i })).toBeVisible();
});

test("PWA manifest and service worker are served", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const json = await manifest.json();
  expect(json.name).toBe("Formkoll");
  expect(json.display).toBe("standalone");
  expect(json.icons.length).toBeGreaterThanOrEqual(3);
  const sw = await request.get("/sw.js");
  expect(sw.ok()).toBeTruthy();
  expect(sw.headers()["content-type"]).toContain("javascript");
});

test.describe("signed in", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await signIn(context, baseURL!);
  });

  test("shows the five-tab shell", async ({ page }) => {
    await page.goto("/body");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const label of ["Today", "Week", "Food", "Body", "Shop"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
    await expect(nav.getByRole("link", { name: "Body" })).toHaveAttribute("aria-current", "page");
  });

  test("settings lists the seeded targets and can sign out", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    const table = page.getByRole("table");
    await expect(table.getByText("2,400")).toBeVisible();
    await expect(table.getByText("2,000")).toBeVisible();
    await expect(table.getByText("2,750")).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
