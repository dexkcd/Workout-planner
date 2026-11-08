import type { PlanCalendar, TargetRow, TemplateSession } from "../types";

export const calendar: PlanCalendar = {
  planStart: "2026-11-09",
  dietBreak: { from: "2026-12-21", to: "2027-01-04" },
  deloadEveryNWeeks: 4,
};

const t = (
  weekday: TemplateSession["weekday"],
  sessionType: TemplateSession["sessionType"],
  title: string,
  startTime: string | null = null,
  endTime: string | null = null,
  locationKey: string | null = null,
): TemplateSession => ({ weekday, sessionType, title, startTime, endTime, locationKey, notes: null, sortOrder: 0 });

export const baseTemplate: TemplateSession[] = [
  t(1, "climb_hard", "Bouldering 1: hard problems", "16:45", "18:25", "klattercentret_telefonplan"),
  t(2, "gym_a", "Gym A: strength", null, null, "f247_hotorget"),
  t(3, "climb_volume", "Bouldering 2: volume and technique", "16:45", "18:25", "klattercentret_telefonplan"),
  t(4, "frisbee", "Ultimate frisbee", "21:00", "22:30", "kanalhallen"),
  t(5, "rest", "Rest"),
  t(6, "gym_b", "Gym B: power and conditioning", "11:00", "12:00", "f247_sodertalje_centrum"),
  t(7, "walk", "Rest and a long walk"),
];

export const tuesdayFrisbeeTemplate: TemplateSession[] = [
  t(1, "climb_hard", "Bouldering 1: hard problems", "16:45", "18:25", "klattercentret_telefonplan"),
  t(2, "frisbee", "Ultimate frisbee", "21:00", "22:30", "kanalhallen"),
  t(3, "rest", "Rest (or 60 min easy technique climbing)"),
  t(4, "frisbee", "Ultimate frisbee", "21:00", "22:30", "kanalhallen"),
  t(5, "rest", "Rest"),
  t(6, "gym_full", "Gym: full body", "11:00", "12:00", "f247_sodertalje_centrum"),
  t(7, "walk", "Rest and a long walk"),
];

export const seedTargets: TargetRow[] = [
  { effectiveFrom: "2026-11-09", dayType: "training", kcal: 2400, proteinG: 160, carbsG: 280, fatG: 70 },
  { effectiveFrom: "2026-11-09", dayType: "rest", kcal: 2000, proteinG: 160, carbsG: 180, fatG: 70 },
  { effectiveFrom: "2026-11-09", dayType: "break", kcal: 2750, proteinG: 160, carbsG: null, fatG: null },
];
