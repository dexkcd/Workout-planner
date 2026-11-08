import rawPlan from "@/seed/plan.json";
import { parsePlanSeed, WEEKDAY_KEYS, type PlanSeed, type TemplateSessionSeed } from "@/lib/seed/planSchema";
import type { IsoWeekday, PlanCalendar, TemplateKey, TemplateSession } from "@/lib/rules/types";

/** The validated plan from seed/plan.json, loaded once at module init. */
export const plan: PlanSeed = parsePlanSeed(rawPlan);

export const planCalendar: PlanCalendar = {
  planStart: plan.meta.plan_start,
  dietBreak: plan.meta.diet_break,
  deloadEveryNWeeks: plan.meta.deload_every_n_weeks,
};

export function weekdayKeyToIso(key: (typeof WEEKDAY_KEYS)[number]): IsoWeekday {
  return (WEEKDAY_KEYS.indexOf(key) + 1) as IsoWeekday;
}

/** Template rows from the seed in the shape the rules module uses. */
export function templateSessionsFromSeed(rows: TemplateSessionSeed[]): TemplateSession[] {
  return rows.map((row, i) => ({
    weekday: weekdayKeyToIso(row.weekday),
    sessionType: row.session_type,
    title: row.title,
    startTime: row.start,
    endTime: row.end,
    locationKey: row.location,
    notes: row.notes ?? null,
    sortOrder: i,
  }));
}

export function seedTemplate(key: TemplateKey): TemplateSession[] {
  return templateSessionsFromSeed(plan.schedule_templates[key]);
}
