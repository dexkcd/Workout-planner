import { isDietBreakDate } from "./schedule";
import { TRAINING_SESSION_TYPES, type DateRange, type DayType, type LocalDate, type SessionLike } from "./types";

export interface DayTypeInput {
  date: LocalDate;
  /** Sessions on this date (any status). */
  sessions: readonly SessionLike[];
  /** Manual override for the date, if any. */
  override?: DayType | null;
  dietBreak: DateRange;
}

/** Statuses that count as "the session happens / happened". */
const COUNTING_STATUSES = new Set(["planned", "done"]);

export function isTrainingSession(s: SessionLike): boolean {
  return TRAINING_SESSION_TYPES.includes(s.sessionType) && COUNTING_STATUSES.has(s.status);
}

/**
 * Training if the day has a gym, climbing or frisbee session that is planned
 * or done. Skipped and moved sessions don't count. A manual override wins over
 * the sessions, and diet-break dates are always "break".
 */
export function dayType({ date, sessions, override, dietBreak }: DayTypeInput): DayType {
  if (isDietBreakDate(date, dietBreak)) return "break";
  if (override) return override;
  return sessions.some((s) => s.date === date && isTrainingSession(s)) ? "training" : "rest";
}

export const DAY_TYPE_LABEL: Record<DayType, string> = {
  training: "Training day",
  rest: "Rest day",
  break: "Diet break",
};
