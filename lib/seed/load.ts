import { eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { locations, scheduleTemplates, targets, templateSessions, users } from "@/lib/db/schema";
import { WEEKDAY_KEYS, type PlanSeed } from "./planSchema";
import type { TemplateKey } from "@/lib/rules/types";

const TEMPLATE_NAMES: Record<TemplateKey, string> = {
  base: "Base week",
  tuesday_frisbee: "Tuesday frisbee week",
};

export interface SeedSummary {
  locations: number;
  templates: number;
  templateSessions: number;
  targets: number;
  userCreated: boolean;
}

/**
 * Idempotent: upserts by natural key, so running it twice changes nothing.
 * Only the tables Milestones 1–2 need are loaded here; later milestones add
 * exercises, workouts, meal templates, recipes, staples and reminders.
 */
export async function loadPlanSeed(db: Db, plan: PlanSeed, opts: { ownerEmail?: string } = {}): Promise<SeedSummary> {
  const summary: SeedSummary = { locations: 0, templates: 0, templateSessions: 0, targets: 0, userCreated: false };

  await db.transaction(async (tx) => {
    // Locations
    const locationIds = new Map<string, string>();
    for (const loc of plan.locations) {
      const [row] = await tx
        .insert(locations)
        .values({ key: loc.key, name: loc.name, address: loc.address, notes: loc.notes ?? null })
        .onConflictDoUpdate({
          target: locations.key,
          set: { name: loc.name, address: loc.address, notes: loc.notes ?? null },
        })
        .returning({ id: locations.id });
      locationIds.set(loc.key, row.id);
      summary.locations++;
    }

    // Schedule templates and their sessions
    for (const key of ["base", "tuesday_frisbee"] as const) {
      const [tpl] = await tx
        .insert(scheduleTemplates)
        .values({ key, name: TEMPLATE_NAMES[key] })
        .onConflictDoUpdate({ target: scheduleTemplates.key, set: { name: TEMPLATE_NAMES[key] } })
        .returning({ id: scheduleTemplates.id });
      summary.templates++;

      // Replace the template's rows wholesale; they are plan data, not history.
      await tx.delete(templateSessions).where(eq(templateSessions.templateId, tpl.id));
      const rows = plan.schedule_templates[key].map((s, i) => ({
        templateId: tpl.id,
        weekday: WEEKDAY_KEYS.indexOf(s.weekday) + 1,
        sessionType: s.session_type,
        title: s.title,
        startTime: s.start,
        endTime: s.end,
        locationId: s.location ? (locationIds.get(s.location) ?? null) : null,
        notes: s.notes ?? null,
        sortOrder: i,
      }));
      if (rows.length) await tx.insert(templateSessions).values(rows);
      summary.templateSessions += rows.length;
    }

    // Targets: seed rows are inserted once and never edited afterwards.
    for (const t of plan.targets) {
      const inserted = await tx
        .insert(targets)
        .values({
          effectiveFrom: t.effective_from,
          dayType: t.day_type,
          kcal: t.kcal,
          proteinG: t.protein_g,
          carbsG: t.carbs_g,
          fatG: t.fat_g,
          source: "seed",
          note: "From seed/plan.json",
        })
        .onConflictDoNothing({ target: [targets.effectiveFrom, targets.dayType] })
        .returning({ id: targets.id });
      summary.targets += inserted.length;
    }

    // The single user, if an owner email is configured.
    if (opts.ownerEmail) {
      const email = opts.ownerEmail.trim().toLowerCase();
      const existing = await tx.select({ id: users.id }).from(users).limit(1);
      if (existing.length === 0) {
        await tx.insert(users).values({ email, displayName: "Dexter" });
        summary.userCreated = true;
      }
    }
  });

  // Keep sequences and planner stats fresh after a bulk load.
  await db.execute(sql`analyze`);
  return summary;
}
