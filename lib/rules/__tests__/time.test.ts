import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  endOfWeek,
  formatWeekRange,
  formatWeekdayDayMonth,
  isLocalDate,
  isoWeekday,
  localTimeInStockholm,
  startOfWeek,
  todayInStockholm,
  weekDates,
} from "../time";

describe("todayInStockholm", () => {
  it("rolls over at local midnight, not UTC midnight (CET, +1)", () => {
    expect(todayInStockholm(new Date("2026-11-09T22:59:00Z"))).toBe("2026-11-09");
    expect(todayInStockholm(new Date("2026-11-09T23:30:00Z"))).toBe("2026-11-10");
  });

  it("handles the spring DST changeover (last Sunday of March 2027 → CEST, +2)", () => {
    expect(todayInStockholm(new Date("2027-03-27T23:30:00Z"))).toBe("2027-03-28");
    // 22:30Z is 00:30 CEST on the 29th.
    expect(todayInStockholm(new Date("2027-03-28T22:30:00Z"))).toBe("2027-03-29");
    expect(todayInStockholm(new Date("2027-03-28T21:30:00Z"))).toBe("2027-03-28");
  });

  it("handles the autumn DST changeover (last Sunday of October 2026 → CET)", () => {
    expect(todayInStockholm(new Date("2026-10-24T22:30:00Z"))).toBe("2026-10-25");
    // After the change, 23:30Z is 00:30 CET on the 26th.
    expect(todayInStockholm(new Date("2026-10-25T23:30:00Z"))).toBe("2026-10-26");
    expect(todayInStockholm(new Date("2026-10-25T22:30:00Z"))).toBe("2026-10-25");
  });

  it("gives the local wall-clock time", () => {
    expect(localTimeInStockholm(new Date("2026-11-09T14:30:00Z"))).toBe("15:30");
    expect(localTimeInStockholm(new Date("2027-03-29T14:30:00Z"))).toBe("16:30");
    expect(localTimeInStockholm(new Date("2026-11-09T23:05:00Z"))).toBe("00:05");
  });
});

describe("calendar arithmetic", () => {
  it("knows weekdays", () => {
    expect(isoWeekday("2026-11-09")).toBe(1); // Monday, plan start
    expect(isoWeekday("2026-11-15")).toBe(7);
    expect(isoWeekday("2027-03-28")).toBe(7);
    expect(isoWeekday("2026-10-25")).toBe(7);
  });

  it("finds the Monday for every day of both DST weeks", () => {
    for (let i = 0; i < 7; i++) {
      expect(startOfWeek(addDays("2026-10-19", i))).toBe("2026-10-19");
      expect(startOfWeek(addDays("2027-03-22", i))).toBe("2027-03-22");
    }
    expect(endOfWeek("2027-03-24")).toBe("2027-03-28");
  });

  it("adds days across changeovers and month ends without drift", () => {
    expect(addDays("2027-03-28", 1)).toBe("2027-03-29");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-28", 7)).toBe("2027-01-04");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
  });

  it("measures whole weeks as exactly 7 days across DST", () => {
    expect(daysBetween("2026-10-19", "2026-10-26")).toBe(7);
    expect(daysBetween("2027-03-22", "2027-03-29")).toBe(7);
    expect(daysBetween("2026-11-09", "2027-01-18")).toBe(70);
  });

  it("lists the seven dates of a week", () => {
    expect(weekDates("2026-12-28")).toEqual([
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
  });

  it("validates dates", () => {
    expect(isLocalDate("2027-02-28")).toBe(true);
    expect(isLocalDate("2027-02-29")).toBe(false);
    expect(isLocalDate("2027-13-01")).toBe(false);
    expect(isLocalDate("27-01-01")).toBe(false);
    expect(isLocalDate(20270101)).toBe(false);
  });
});

describe("formatting", () => {
  it("formats week ranges like the mockups", () => {
    expect(formatWeekRange("2027-01-18")).toBe("18–24 Jan");
    expect(formatWeekRange("2026-11-30")).toBe("30 Nov – 6 Dec");
    expect(formatWeekRange("2026-12-28")).toBe("28 Dec – 3 Jan");
  });

  it("formats long dates", () => {
    expect(formatWeekdayDayMonth("2027-01-20")).toBe("Wednesday 20 Jan");
  });
});
