import { describe, expect, it } from "vitest";
import { dayType } from "../dayType";
import { generateWeek } from "../schedule";
import { baseTemplate, calendar } from "./fixtures";

const week = generateWeek({ weekStart: "2026-11-09", template: baseTemplate, calendar }).sessions;

describe("dayType", () => {
  it("is training on days with a planned gym, climb or frisbee session", () => {
    expect(dayType({ date: "2026-11-09", sessions: week, dietBreak: calendar.dietBreak })).toBe("training");
    expect(dayType({ date: "2026-11-12", sessions: week, dietBreak: calendar.dietBreak })).toBe("training");
  });

  it("is rest on rest and walk days", () => {
    expect(dayType({ date: "2026-11-13", sessions: week, dietBreak: calendar.dietBreak })).toBe("rest");
    expect(dayType({ date: "2026-11-15", sessions: week, dietBreak: calendar.dietBreak })).toBe("rest");
  });

  it("follows what was actually done: an extra done session makes a rest day training", () => {
    const sessions = [...week, { date: "2026-11-13", sessionType: "gym_b" as const, status: "done" as const }];
    expect(dayType({ date: "2026-11-13", sessions, dietBreak: calendar.dietBreak })).toBe("training");
  });

  it("does not count skipped or moved sessions", () => {
    const sessions = week.map((s) => (s.date === "2026-11-10" ? { ...s, status: "skipped" as const } : s));
    expect(dayType({ date: "2026-11-10", sessions, dietBreak: calendar.dietBreak })).toBe("rest");
    const moved = week.map((s) => (s.date === "2026-11-10" ? { ...s, status: "moved" as const } : s));
    expect(dayType({ date: "2026-11-10", sessions: moved, dietBreak: calendar.dietBreak })).toBe("rest");
  });

  it("lets a manual override win over the sessions", () => {
    expect(dayType({ date: "2026-11-09", sessions: week, override: "rest", dietBreak: calendar.dietBreak })).toBe("rest");
    expect(dayType({ date: "2026-11-13", sessions: week, override: "training", dietBreak: calendar.dietBreak })).toBe(
      "training",
    );
  });

  it("is always break inside the diet break, even with an override", () => {
    expect(dayType({ date: "2026-12-25", sessions: [], dietBreak: calendar.dietBreak })).toBe("break");
    expect(dayType({ date: "2026-12-25", sessions: [], override: "training", dietBreak: calendar.dietBreak })).toBe(
      "break",
    );
    expect(dayType({ date: "2027-01-04", sessions: [], dietBreak: calendar.dietBreak })).toBe("break");
    expect(dayType({ date: "2027-01-05", sessions: [], dietBreak: calendar.dietBreak })).toBe("rest");
  });
});
