import { z } from "zod";
import { DAY_TYPES, SESSION_TYPES } from "@/lib/rules/types";

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD expected");
const localTime = z.string().regex(/^\d{2}:\d{2}$/, "HH:MM expected");
const weekdayKey = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

const targetSeed = z.object({
  effective_from: localDate,
  day_type: z.enum(DAY_TYPES),
  kcal: z.number().int().positive(),
  protein_g: z.number().int().positive(),
  carbs_g: z.number().int().nonnegative().nullable(),
  fat_g: z.number().int().nonnegative().nullable(),
});

const locationSeed = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  address: z.string().nullable(),
  notes: z.string().nullable().optional(),
});

const templateSessionSeed = z.object({
  weekday: weekdayKey,
  session_type: z.enum(SESSION_TYPES),
  title: z.string().min(1),
  start: localTime.nullable(),
  end: localTime.nullable(),
  location: z.string().nullable(),
  notes: z.string().nullable().optional(),
});

const exerciseSeed = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  alt: z.string().optional(),
  category: z.string(),
  equipment: z.string(),
  increment_kg: z.number().nonnegative(),
  why: z.string().optional(),
});

const workoutItemSeed = z.object({
  exercise: z.string().min(1),
  sets: z.number().int().positive(),
  rep_min: z.number().int().positive(),
  rep_max: z.number().int().positive(),
  unit: z.enum(["reps", "seconds"]),
  per_side: z.boolean().optional(),
  note: z.string().optional(),
});

const mealTemplateItemSeed = z.object({
  slot: z.string().min(1),
  time: localTime.nullable(),
  optional: z.boolean().optional(),
  description: z.string().min(1),
  kcal: z.number().nonnegative(),
  protein_g: z.number().nonnegative(),
});

const mealTemplateSeed = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  day_type: z.enum(DAY_TYPES),
  weekdays: z.array(weekdayKey),
  total_kcal: z.number().nonnegative(),
  total_protein_g: z.number().nonnegative(),
  items: z.array(mealTemplateItemSeed).min(1),
});

const recipeSeed = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  portions: z.number().int().positive(),
  grams_are: z.string().optional(),
  notes: z.string().optional(),
  ingredients: z.array(z.object({ food: z.string().min(1), grams: z.number().positive() })).min(1),
});

const reminderSeed = z.object({
  key: z.string().min(1),
  when: z.union([z.string(), z.array(weekdayKey)]),
  time: localTime,
  text: z.string().min(1),
});

export const planSeedSchema = z.object({
  _about: z.string().optional(),
  meta: z.object({
    timezone: z.literal("Europe/Stockholm"),
    week_starts_on: z.literal("monday"),
    units: z.record(z.string(), z.string()),
    plan_start: localDate,
    start_weight_kg: z.number().positive(),
    goal_weight_range_kg: z.tuple([z.number(), z.number()]),
    projection_kg_per_week: z.number().positive(),
    projection_milestones: z.array(z.object({ date: localDate, kg: z.number().positive() })),
    diet_break: z.object({ from: localDate, to: localDate }),
    deload_every_n_weeks: z.number().int().positive(),
    work_pattern: z.object({ office_days: z.array(weekdayKey), work_from_home: weekdayKey }),
  }),
  targets: z.array(targetSeed).min(1),
  adjustment_rules: z.record(z.string(), z.unknown()),
  locations: z.array(locationSeed).min(1),
  session_types: z.array(z.enum(SESSION_TYPES)),
  schedule_templates: z.object({
    base: z.array(templateSessionSeed).length(7),
    tuesday_frisbee: z.array(templateSessionSeed).length(7),
    tuesday_frisbee_guidance: z.string().optional(),
  }),
  exercises: z.array(exerciseSeed),
  workouts: z.object({
    warm_up: z.string(),
    effort: z.string(),
    gym_a: z.array(workoutItemSeed),
    gym_b: z.array(workoutItemSeed),
    gym_full: z.array(workoutItemSeed),
  }),
  climbing: z.record(z.string(), z.unknown()),
  meal_slots: z.array(z.object({ key: z.string(), label: z.string(), default_time: localTime.nullable() })),
  meal_templates: z.array(mealTemplateSeed),
  recipes: z.array(recipeSeed),
  staples: z.record(z.string(), z.array(z.string())),
  shopping_sections: z.array(z.string()),
  reminders: z.array(reminderSeed),
});

export type PlanSeed = z.infer<typeof planSeedSchema>;
export type TemplateSessionSeed = z.infer<typeof templateSessionSeed>;
export type MealTemplateSeed = z.infer<typeof mealTemplateSeed>;

export function parsePlanSeed(raw: unknown): PlanSeed {
  return planSeedSchema.parse(raw);
}
