import { describe, expect, it } from "vitest";
import { nextMeal, templateForDay } from "../meals";
import { generateWeek } from "../schedule";
import { weekSummary } from "../summary";
import { baseTemplate, calendar } from "./fixtures";

describe("weekSummary", () => {
  it("counts training sessions only, like the mockup's '2 of 5'", () => {
    const sessions = generateWeek({ weekStart: "2027-01-18", template: baseTemplate, calendar }).sessions.map((s) =>
      s.sessionType === "climb_hard" || s.sessionType === "gym_a" ? { ...s, status: "done" as const } : s,
    );
    expect(weekSummary(sessions)).toEqual({ planned: 5, done: 2, skipped: 0 });
  });

  it("drops moved sessions from the planned count and counts skips", () => {
    const sessions = generateWeek({ weekStart: "2027-01-18", template: baseTemplate, calendar }).sessions.map((s) => {
      if (s.sessionType === "gym_b") return { ...s, status: "moved" as const };
      if (s.sessionType === "frisbee") return { ...s, status: "skipped" as const };
      return s;
    });
    expect(weekSummary(sessions)).toEqual({ planned: 4, done: 0, skipped: 1 });
  });
});

const templates = [
  { key: "office", name: "Office training day", dayType: "training" as const, weekdays: [1, 2, 3], items: [
    { slot: "morning", time: "10:30", optional: true, description: "Kvarg", kcal: 150, proteinG: 28 },
    { slot: "lunch", time: "11:30", description: "Dagens lunch", kcal: 750, proteinG: 50 },
    { slot: "afternoon", time: "15:30", description: "Pre-climb snack", kcal: 400, proteinG: 30 },
    { slot: "dinner", time: "19:30", description: "Chicken and rice", kcal: 950, proteinG: 55 },
    { slot: "evening", time: "21:30", description: "Fruit and nuts", kcal: 150, proteinG: 3 },
  ] },
  { key: "thu", name: "Frisbee Thursday", dayType: "training" as const, weekdays: [4], items: [
    { slot: "lunch", time: "12:00", description: "Chili", kcal: 700, proteinG: 50 },
  ] },
  { key: "rest", name: "Rest day", dayType: "rest" as const, weekdays: [5, 7], items: [
    { slot: "lunch", time: "12:00", description: "Leftovers", kcal: 650, proteinG: 50 },
    { slot: "flex", time: null, description: "Fika", kcal: 300, proteinG: 0 },
  ] },
];

describe("templateForDay", () => {
  it("prefers the template written for the weekday", () => {
    expect(templateForDay(templates, 4, "training")?.key).toBe("thu");
    expect(templateForDay(templates, 1, "training")?.key).toBe("office");
  });

  it("falls back to the day type when no weekday matches", () => {
    expect(templateForDay(templates, 6, "training")?.key).toBe("office");
    expect(templateForDay(templates, 2, "rest")?.key).toBe("rest");
    expect(templateForDay(templates, 6, "break")?.key).toBe("office");
  });
});

describe("nextMeal", () => {
  const items = templates[0].items;

  it("finds the next timed, non-optional meal", () => {
    expect(nextMeal(items, "09:00")?.slot).toBe("lunch");
    expect(nextMeal(items, "13:00")?.slot).toBe("afternoon");
    expect(nextMeal(items, "15:30")?.slot).toBe("afternoon");
  });

  it("keeps showing a meal for a while after its time", () => {
    expect(nextMeal(items, "16:00")?.slot).toBe("afternoon");
    expect(nextMeal(items, "16:30")?.slot).toBe("dinner");
  });

  it("returns nothing when the day's meals are over", () => {
    expect(nextMeal(items, "23:00")).toBeUndefined();
    expect(nextMeal(templates[2].items, "13:00")).toBeUndefined();
  });
});
