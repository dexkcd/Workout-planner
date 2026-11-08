import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers";

// Dates come from the mockups: week 11 is 18–24 Jan 2027 and Wednesday 20 Jan
// is Bouldering 2. The server honours ?date= because FORMKOLL_ALLOW_DATE_OVERRIDE=1.

test.beforeEach(async ({ context, baseURL }) => {
  await signIn(context, baseURL!);
});

async function rowFor(page: Page, date: string) {
  return page.locator(`li[data-date="${date}"]`).first();
}

test("Today shows the week, day type, targets, session and next meal", async ({ page }) => {
  await page.goto("/today?date=2027-01-20&time=13:00");
  await expect(page.getByText("Week 11 · Training day")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wednesday 20 Jan" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bouldering 2" })).toBeVisible();
  await expect(page.getByText("Klättercentret Telefonplan")).toBeVisible();
  await expect(page.getByText("/ 2,400 kcal")).toBeVisible();
  await expect(page.getByText("/ 160 g")).toBeVisible();
  await expect(page.getByText("2,400 kcal and 160 g protein left")).toBeVisible();
  await expect(page.getByText("Afternoon", { exact: true })).toBeVisible();
  await expect(page.getByText("15:30")).toBeVisible();
});

test("Week lists the seven days with flags and can mark a session done", async ({ page }) => {
  await page.goto("/week?week=2027-01-18&date=2027-01-20");
  await expect(page.getByRole("heading", { name: "Week 11" })).toBeVisible();
  await expect(page.getByText("18–24 Jan · deload next week")).toBeVisible();
  await expect(page.locator("li[data-date]")).toHaveCount(7);
  await expect((await rowFor(page, "2027-01-20")).getByText("Today")).toBeVisible();
  await expect((await rowFor(page, "2027-01-22")).getByText("Rest day")).toBeVisible();
  await expect(page.getByText("0 of 5")).toBeVisible();

  await page.goto("/today?date=2027-01-18");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("Done", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();

  await page.goto("/week?week=2027-01-18&date=2027-01-20");
  await expect((await rowFor(page, "2027-01-18")).getByText("Done")).toBeVisible();
  await expect(page.getByText("1 of 5")).toBeVisible();

  await page.goto("/today?date=2027-01-18");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible();
});

test("the Tuesday-frisbee toggle swaps Tuesday, Wednesday and Saturday", async ({ page }) => {
  await page.goto("/week?week=2027-01-18&date=2027-01-20");
  await expect((await rowFor(page, "2027-01-19")).getByText("Gym A · strength")).toBeVisible();

  const toggle = page.getByRole("switch", { name: "Tuesday frisbee this week" });
  await toggle.click();
  await expect((await rowFor(page, "2027-01-19")).getByText("Ultimate frisbee")).toBeVisible();
  await expect((await rowFor(page, "2027-01-20")).getByText("Rest", { exact: true })).toBeVisible();
  await expect((await rowFor(page, "2027-01-23")).getByText("Gym · full body")).toBeVisible();
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-checked", "true");

  await toggle.click();
  await expect((await rowFor(page, "2027-01-19")).getByText("Gym A · strength")).toBeVisible();
  await expect((await rowFor(page, "2027-01-23")).getByText("Gym B · power")).toBeVisible();
});

test("diet-break days switch to maintenance targets", async ({ page }) => {
  await page.goto("/today?date=2026-12-25");
  await expect(page.getByText(/Week 7 · Diet break/)).toBeVisible();
  await expect(page.getByText("/ 2,750 kcal")).toBeVisible();
  await page.goto("/week?week=2026-12-28&date=2026-12-25");
  await expect(page.getByText("28 Dec – 3 Jan · diet break · deload week")).toBeVisible();
});

test("the day type can be overridden by hand", async ({ page }) => {
  await page.goto("/today?date=2027-01-22");
  await expect(page.getByText("Week 11 · Rest day")).toBeVisible();
  await expect(page.getByText("/ 2,000 kcal")).toBeVisible();
  await page.getByLabel("Day type").selectOption("training");
  await page.getByRole("button", { name: "Set" }).click();
  await expect(page.getByText("Week 11 · Training day")).toBeVisible();
  await expect(page.getByText("/ 2,400 kcal")).toBeVisible();
  await page.getByLabel(/Day type/).selectOption("auto");
  await page.getByRole("button", { name: "Set" }).click();
  await expect(page.getByText("Week 11 · Rest day")).toBeVisible();
});

test("a session can be moved to another day and back", async ({ page }) => {
  await page.goto("/today?date=2027-01-21");
  await page.getByRole("button", { name: "Move" }).click();
  await page.getByRole("button", { name: /Friday/ }).click();
  await expect(page.getByText("Moved to 22 Jan")).toBeVisible();
  await page.goto("/week?week=2027-01-18&date=2027-01-21");
  await expect(page.locator('li[data-date="2027-01-22"][data-session-type="frisbee"]')).toBeVisible();
  await page.goto("/today?date=2027-01-21");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible();
  await page.goto("/week?week=2027-01-18&date=2027-01-21");
  await expect(page.locator('li[data-date="2027-01-22"]')).toHaveCount(1);
});
