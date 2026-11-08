import { addDays, daysBetween, isBetween, startOfWeek, weekDates } from "./time";
import type {
  DateRange,
  GeneratedWeek,
  LocalDate,
  PlanCalendar,
  PlannedSessionDraft,
  SessionLike,
  SessionStatus,
  TemplateKey,
  TemplateSession,
} from "./types";

/** 1-based week number counted from the Monday of the plan's first week. */
export function weekNumber(weekStart: LocalDate, planStart: LocalDate): number {
  const firstMonday = startOfWeek(planStart);
  return Math.floor(daysBetween(firstMonday, startOfWeek(weekStart)) / 7) + 1;
}

/** Every Nth week counted from plan start (weeks 4, 8, 12 … for N = 4). */
export function isDeloadWeek(weekStart: LocalDate, planStart: LocalDate, everyNWeeks = 4): boolean {
  const n = weekNumber(weekStart, planStart);
  return n >= 1 && n % everyNWeeks === 0;
}

export function isDietBreakDate(date: LocalDate, range: DateRange): boolean {
  return isBetween(date, range.from, range.to);
}

export function weekOverlapsDietBreak(weekStart: LocalDate, range: DateRange): boolean {
  return weekDates(startOfWeek(weekStart)).some((d) => isDietBreakDate(d, range));
}

/** The "Tuesday frisbee this week" toggle simply picks the other template. */
export function templateKeyFor(tuesdayFrisbee: boolean): TemplateKey {
  return tuesdayFrisbee ? "tuesday_frisbee" : "base";
}

export interface GenerateWeekInput {
  weekStart: LocalDate;
  template: readonly TemplateSession[];
  calendar: PlanCalendar;
}

/** Materialises a template onto the seven dates of a week. */
export function generateWeek({ weekStart, template, calendar }: GenerateWeekInput): GeneratedWeek {
  const monday = startOfWeek(weekStart);
  const sessions: PlannedSessionDraft[] = [...template]
    .sort((a, b) => a.weekday - b.weekday || a.sortOrder - b.sortOrder)
    .map((t) => ({
      date: addDays(monday, t.weekday - 1),
      sessionType: t.sessionType,
      title: t.title,
      startTime: t.startTime,
      endTime: t.endTime,
      locationKey: t.locationKey,
      notes: t.notes,
      sortOrder: t.sortOrder,
      status: "planned",
    }));
  return {
    weekStart: monday,
    weekEnd: addDays(monday, 6),
    weekNumber: weekNumber(monday, calendar.planStart),
    isDeload: isDeloadWeek(monday, calendar.planStart, calendar.deloadEveryNWeeks),
    isDietBreak: weekOverlapsDietBreak(monday, calendar.dietBreak),
    sessions,
  };
}

/**
 * When a week is regenerated (template toggle), carry statuses over to the
 * new drafts where the same session type is still planned on the same date.
 * Sessions that no longer exist in the new template lose their status.
 */
export function mergeStatuses<T extends SessionLike>(
  existing: readonly T[],
  drafts: readonly PlannedSessionDraft[],
): PlannedSessionDraft[] {
  const byKey = new Map<string, SessionStatus>();
  for (const s of existing) byKey.set(`${s.date}|${s.sessionType}`, s.status);
  return drafts.map((d) => ({ ...d, status: byKey.get(`${d.date}|${d.sessionType}`) ?? "planned" }));
}

/**
 * Done sessions on days whose plan changes with the toggle. The caller can
 * warn about these; they are preserved as extra rows rather than deleted.
 */
export function doneSessionsLostBy<T extends SessionLike>(
  existing: readonly T[],
  drafts: readonly PlannedSessionDraft[],
): T[] {
  const keep = new Set(drafts.map((d) => `${d.date}|${d.sessionType}`));
  return existing.filter((s) => s.status === "done" && !keep.has(`${s.date}|${s.sessionType}`));
}

/** Gym targets drop to 2 sets in a deload week, same weights. */
export function gymTargetSets(plannedSets: number, isDeload: boolean): number {
  return isDeload ? Math.min(plannedSets, 2) : plannedSets;
}
