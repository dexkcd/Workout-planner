/**
 * Shared types for the pure rules module. Everything here is plain data:
 * no Date objects, no DB rows, no React.
 */

/** A calendar date in Europe/Stockholm, formatted YYYY-MM-DD. */
export type LocalDate = string;

/** A wall-clock time, formatted HH:MM. */
export type LocalTime = string;

export const SESSION_TYPES = [
  "climb_hard",
  "climb_volume",
  "gym_a",
  "gym_b",
  "gym_full",
  "frisbee",
  "walk",
  "rest",
] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

/** Session types that make a day a training day. */
export const TRAINING_SESSION_TYPES: readonly SessionType[] = [
  "climb_hard",
  "climb_volume",
  "gym_a",
  "gym_b",
  "gym_full",
  "frisbee",
];

export const GYM_SESSION_TYPES: readonly SessionType[] = ["gym_a", "gym_b", "gym_full"];
export const CLIMB_SESSION_TYPES: readonly SessionType[] = ["climb_hard", "climb_volume"];

export const DAY_TYPES = ["training", "rest", "break"] as const;
export type DayType = (typeof DAY_TYPES)[number];

export const SESSION_STATUSES = ["planned", "done", "skipped", "moved"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const TEMPLATE_KEYS = ["base", "tuesday_frisbee"] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface DateRange {
  from: LocalDate;
  to: LocalDate;
}

/** One row of a schedule template (what happens on a weekday). */
export interface TemplateSession {
  weekday: IsoWeekday;
  sessionType: SessionType;
  title: string;
  startTime: LocalTime | null;
  endTime: LocalTime | null;
  locationKey: string | null;
  notes: string | null;
  sortOrder: number;
}

/** A session generated for a concrete date, before it is stored. */
export interface PlannedSessionDraft {
  date: LocalDate;
  sessionType: SessionType;
  title: string;
  startTime: LocalTime | null;
  endTime: LocalTime | null;
  locationKey: string | null;
  notes: string | null;
  sortOrder: number;
  status: SessionStatus;
}

/** The minimum the rules need to know about a session on a date. */
export interface SessionLike {
  date: LocalDate;
  sessionType: SessionType;
  status: SessionStatus;
}

export interface TargetRow {
  effectiveFrom: LocalDate;
  dayType: DayType;
  kcal: number;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
}

export interface PlanCalendar {
  /** First day of the plan (a Monday in the seed). */
  planStart: LocalDate;
  dietBreak: DateRange;
  deloadEveryNWeeks: number;
}

export interface GeneratedWeek {
  weekStart: LocalDate;
  weekEnd: LocalDate;
  weekNumber: number;
  isDeload: boolean;
  isDietBreak: boolean;
  sessions: PlannedSessionDraft[];
}
