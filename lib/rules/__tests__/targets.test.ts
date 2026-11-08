import { describe, expect, it } from "vitest";
import { remaining, targetsFor } from "../targets";
import { seedTargets } from "./fixtures";

describe("targetsFor", () => {
  it("returns the seed targets per day type", () => {
    expect(targetsFor("2026-11-20", "training", seedTargets)).toMatchObject({ kcal: 2400, proteinG: 160, carbsG: 280, fatG: 70 });
    expect(targetsFor("2026-11-20", "rest", seedTargets)).toMatchObject({ kcal: 2000, proteinG: 160, carbsG: 180, fatG: 70 });
    expect(targetsFor("2026-12-25", "break", seedTargets)).toMatchObject({ kcal: 2750, proteinG: 160 });
  });

  it("applies a newer row from its effective date and keeps the old one before", () => {
    const rows = [
      ...seedTargets,
      { effectiveFrom: "2026-12-01", dayType: "training" as const, kcal: 2250, proteinG: 160, carbsG: 250, fatG: 70 },
    ];
    expect(targetsFor("2026-11-30", "training", rows)?.kcal).toBe(2400);
    expect(targetsFor("2026-12-01", "training", rows)?.kcal).toBe(2250);
    expect(targetsFor("2027-02-01", "training", rows)?.kcal).toBe(2250);
    expect(targetsFor("2026-12-01", "rest", rows)?.kcal).toBe(2000);
  });

  it("ignores rows that start after the date and unknown day types", () => {
    const rows = [{ effectiveFrom: "2026-12-01", dayType: "training" as const, kcal: 2250, proteinG: 160, carbsG: null, fatG: null }];
    expect(targetsFor("2026-11-20", "training", rows)).toBeUndefined();
    expect(targetsFor("2026-11-20", "break", seedTargets.filter((t) => t.dayType !== "break"))).toBeUndefined();
  });

  it("does not depend on row order", () => {
    const rows = [
      { effectiveFrom: "2026-12-01", dayType: "training" as const, kcal: 2250, proteinG: 160, carbsG: null, fatG: null },
      ...seedTargets,
      { effectiveFrom: "2026-11-20", dayType: "training" as const, kcal: 2300, proteinG: 160, carbsG: null, fatG: null },
    ];
    expect(targetsFor("2026-11-25", "training", rows)?.kcal).toBe(2300);
  });
});

describe("remaining", () => {
  it("reports what is left and flags going over", () => {
    expect(remaining({ kcal: 2400, proteinG: 160 }, 900, 78)).toEqual({ kcalLeft: 1500, proteinLeft: 82, overKcal: false, overProtein: false });
    expect(remaining({ kcal: 2000, proteinG: 160 }, 2150, 170)).toMatchObject({ kcalLeft: -150, overKcal: true, overProtein: true });
  });
});
