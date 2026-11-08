import { describe, expect, it } from "vitest";
import {
  doneSessionsLostBy,
  generateWeek,
  gymTargetSets,
  isDeloadWeek,
  isDietBreakDate,
  mergeStatuses,
  templateKeyFor,
  weekNumber,
  weekOverlapsDietBreak,
} from "../schedule";
import { baseTemplate, calendar, tuesdayFrisbeeTemplate } from "./fixtures";

describe("weekNumber", () => {
  it("counts from the plan's first Monday", () => {
    expect(weekNumber("2026-11-09", calendar.planStart)).toBe(1);
    expect(weekNumber("2026-11-12", calendar.planStart)).toBe(1);
    expect(weekNumber("2026-11-16", calendar.planStart)).toBe(2);
    expect(weekNumber("2027-01-18", calendar.planStart)).toBe(11); // mockup: "Week 11 · 18–24 Jan"
    expect(weekNumber("2027-03-22", calendar.planStart)).toBe(20);
  });
});

describe("isDeloadWeek", () => {
  it("flags every 4th week from plan start", () => {
    expect(isDeloadWeek("2026-11-30", calendar.planStart)).toBe(true); // 4
    expect(isDeloadWeek("2026-12-28", calendar.planStart)).toBe(true); // 8
    expect(isDeloadWeek("2027-01-25", calendar.planStart)).toBe(true); // 12 (mockup: "deload next week" in week 11)
    for (const ws of ["2026-11-09", "2026-11-16", "2026-11-23", "2026-12-07", "2027-01-18"]) {
      expect(isDeloadWeek(ws, calendar.planStart)).toBe(false);
    }
  });
});

describe("diet break", () => {
  it("is inclusive of both ends", () => {
    expect(isDietBreakDate("2026-12-20", calendar.dietBreak)).toBe(false);
    expect(isDietBreakDate("2026-12-21", calendar.dietBreak)).toBe(true);
    expect(isDietBreakDate("2027-01-04", calendar.dietBreak)).toBe(true);
    expect(isDietBreakDate("2027-01-05", calendar.dietBreak)).toBe(false);
  });

  it("flags weeks that overlap the break", () => {
    expect(weekOverlapsDietBreak("2026-12-14", calendar.dietBreak)).toBe(false);
    expect(weekOverlapsDietBreak("2026-12-21", calendar.dietBreak)).toBe(true);
    expect(weekOverlapsDietBreak("2026-12-28", calendar.dietBreak)).toBe(true);
    expect(weekOverlapsDietBreak("2027-01-04", calendar.dietBreak)).toBe(true);
    expect(weekOverlapsDietBreak("2027-01-11", calendar.dietBreak)).toBe(false);
  });
});

describe("generateWeek", () => {
  it("lays the base template onto the plan's first week", () => {
    const week = generateWeek({ weekStart: "2026-11-09", template: baseTemplate, calendar });
    expect(week.weekNumber).toBe(1);
    expect(week.isDeload).toBe(false);
    expect(week.isDietBreak).toBe(false);
    expect(week.weekEnd).toBe("2026-11-15");
    expect(week.sessions).toHaveLength(7);
    expect(week.sessions[0]).toMatchObject({
      date: "2026-11-09",
      sessionType: "climb_hard",
      startTime: "16:45",
      endTime: "18:25",
      locationKey: "klattercentret_telefonplan",
      status: "planned",
    });
    expect(week.sessions.map((s) => s.sessionType)).toEqual([
      "climb_hard",
      "gym_a",
      "climb_volume",
      "frisbee",
      "rest",
      "gym_b",
      "walk",
    ]);
    expect(week.sessions.map((s) => s.date)).toEqual([
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
    ]);
  });

  it("applies the Tuesday-frisbee variant", () => {
    const week = generateWeek({ weekStart: "2026-11-16", template: tuesdayFrisbeeTemplate, calendar });
    const byDate = Object.fromEntries(week.sessions.map((s) => [s.date, s]));
    expect(byDate["2026-11-17"]).toMatchObject({ sessionType: "frisbee", startTime: "21:00" });
    expect(byDate["2026-11-18"]).toMatchObject({ sessionType: "rest" });
    expect(byDate["2026-11-21"]).toMatchObject({ sessionType: "gym_full" });
  });

  it("accepts any day of the week as input and snaps to Monday", () => {
    const week = generateWeek({ weekStart: "2026-11-12", template: baseTemplate, calendar });
    expect(week.weekStart).toBe("2026-11-09");
  });

  it("keeps dates 7 apart across both DST changeovers", () => {
    for (const monday of ["2026-10-19", "2027-03-22"]) {
      const week = generateWeek({ weekStart: monday, template: baseTemplate, calendar });
      expect(week.sessions.map((s) => s.date)).toHaveLength(7);
      expect(week.sessions[6].date).toBe(
        monday === "2026-10-19" ? "2026-10-25" : "2027-03-28",
      );
    }
  });

  it("flags deload and diet-break weeks", () => {
    const w8 = generateWeek({ weekStart: "2026-12-28", template: baseTemplate, calendar });
    expect(w8.weekNumber).toBe(8);
    expect(w8.isDeload).toBe(true);
    expect(w8.isDietBreak).toBe(true);
  });
});

describe("mergeStatuses", () => {
  const existing = generateWeek({ weekStart: "2026-11-16", template: baseTemplate, calendar }).sessions.map((s) => ({
    ...s,
    status: s.sessionType === "climb_hard" || s.sessionType === "gym_a" ? ("done" as const) : s.status,
  }));
  const drafts = generateWeek({ weekStart: "2026-11-16", template: tuesdayFrisbeeTemplate, calendar }).sessions;
  const merged = mergeStatuses(existing, drafts);

  it("keeps the status of sessions that still exist", () => {
    expect(merged.find((s) => s.date === "2026-11-16")?.status).toBe("done");
  });

  it("drops the status when the day's session changed", () => {
    expect(merged.find((s) => s.date === "2026-11-17")).toMatchObject({ sessionType: "frisbee", status: "planned" });
  });

  it("reports done sessions the new template no longer has", () => {
    expect(doneSessionsLostBy(existing, drafts).map((s) => s.sessionType)).toEqual(["gym_a"]);
  });
});

describe("small helpers", () => {
  it("maps the toggle to a template", () => {
    expect(templateKeyFor(false)).toBe("base");
    expect(templateKeyFor(true)).toBe("tuesday_frisbee");
  });

  it("drops gym sets to 2 in a deload week", () => {
    expect(gymTargetSets(4, true)).toBe(2);
    expect(gymTargetSets(4, false)).toBe(4);
    expect(gymTargetSets(2, true)).toBe(2);
  });
});
