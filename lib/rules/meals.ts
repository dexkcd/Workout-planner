import { timeToMinutes } from "./time";
import type { DayType, LocalTime } from "./types";

export interface MealTemplateItemLike {
  slot: string;
  time: LocalTime | null;
  optional?: boolean;
  description: string;
  kcal: number;
  proteinG: number;
}

export interface MealTemplateLike<I extends MealTemplateItemLike = MealTemplateItemLike> {
  key: string;
  name: string;
  dayType: DayType;
  /** ISO weekdays this template is written for. */
  weekdays: readonly number[];
  items: readonly I[];
}

/**
 * Picks the meal template for a day: one written for that weekday first,
 * otherwise the first template for the day type. Diet-break days use the
 * training-day template (maintenance calories, same meals).
 */
export function templateForDay<T extends MealTemplateLike>(
  templates: readonly T[],
  weekday: number,
  dayType: DayType,
): T | undefined {
  const type: DayType = dayType === "break" ? "training" : dayType;
  return (
    templates.find((t) => t.dayType === type && t.weekdays.includes(weekday)) ??
    templates.find((t) => t.dayType === type)
  );
}

/**
 * The next meal from the template at wall-clock time `now`: the first
 * non-optional item whose time is still ahead (within `graceMinutes` after its
 * time it still counts as "now"). Undefined when the day's meals are over.
 */
export function nextMeal<I extends MealTemplateItemLike>(
  items: readonly I[],
  now: LocalTime,
  graceMinutes = 45,
): I | undefined {
  const nowMin = timeToMinutes(now);
  const timed = items
    .filter((i) => i.time && !i.optional)
    .sort((a, b) => timeToMinutes(a.time!) - timeToMinutes(b.time!));
  return timed.find((i) => timeToMinutes(i.time!) + graceMinutes >= nowMin);
}
