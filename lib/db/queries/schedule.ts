import "server-only";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { getDb, type Db } from "@/lib/db";
import {
  dayTypeOverrides,
  locations,
  plannedSessions,
  scheduleTemplates,
  targets,
  templateSessions,
  weeks,
  type Location,
  type PlannedSession,
  type Week,
} from "@/lib/db/schema";
import { planCalendar } from "@/lib/plan";
import {
  doneSessionsLostBy,
  generateWeek,
  mergeStatuses,
  startOfWeek,
  type DayType,
  type LocalDate,
  type SessionStatus,
  type TemplateKey,
  type TemplateSession,
} from "@/lib/rules";

export interface PlannedSessionView extends PlannedSession {
  location: Pick<Location, "key" | "name" | "address" | "notes"> | null;
}

export interface WeekView {
  week: Week;
  templateKey: TemplateKey;
  sessions: PlannedSessionView[];
}

function trimTime(t: string | null): string | null {
  // Postgres `time` comes back as HH:MM:SS.
  return t ? t.slice(0, 5) : null;
}

export async function getTemplate(db: Db, key: TemplateKey) {
  const [tpl] = await db.select().from(scheduleTemplates).where(eq(scheduleTemplates.key, key)).limit(1);
  if (!tpl) throw new Error(`Schedule template "${key}" is not seeded; run npm run db:seed`);
  const rows = await db
    .select({ session: templateSessions, locationKey: locations.key })
    .from(templateSessions)
    .leftJoin(locations, eq(templateSessions.locationId, locations.id))
    .where(eq(templateSessions.templateId, tpl.id))
    .orderBy(asc(templateSessions.weekday), asc(templateSessions.sortOrder));
  const sessions: TemplateSession[] = rows.map(({ session, locationKey }) => ({
    weekday: session.weekday as TemplateSession["weekday"],
    sessionType: session.sessionType,
    title: session.title,
    startTime: trimTime(session.startTime),
    endTime: trimTime(session.endTime),
    locationKey,
    notes: session.notes,
    sortOrder: session.sortOrder,
  }));
  return { template: tpl, sessions };
}

async function locationIdsByKey(db: Db): Promise<Map<string, string>> {
  const rows = await db.select({ id: locations.id, key: locations.key }).from(locations);
  return new Map(rows.map((r) => [r.key, r.id]));
}

async function sessionsForWeek(db: Db, weekId: string): Promise<PlannedSessionView[]> {
  const rows = await db
    .select({ session: plannedSessions, location: locations })
    .from(plannedSessions)
    .leftJoin(locations, eq(plannedSessions.locationId, locations.id))
    .where(eq(plannedSessions.weekId, weekId))
    .orderBy(asc(plannedSessions.date), asc(plannedSessions.sortOrder), asc(plannedSessions.createdAt));
  return rows.map(({ session, location }) => ({
    ...session,
    startTime: trimTime(session.startTime),
    endTime: trimTime(session.endTime),
    location: location ? { key: location.key, name: location.name, address: location.address, notes: location.notes } : null,
  }));
}

async function loadWeekView(db: Db, week: Week): Promise<WeekView> {
  const [tpl] = await db.select().from(scheduleTemplates).where(eq(scheduleTemplates.id, week.templateId)).limit(1);
  return { week, templateKey: (tpl?.key ?? "base") as TemplateKey, sessions: await sessionsForWeek(db, week.id) };
}

/**
 * The stored week for the date's Monday, created from the base template on
 * first access so template edits only affect weeks not yet opened.
 */
export async function getOrCreateWeek(dateInWeek: LocalDate, db: Db = getDb()): Promise<WeekView> {
  const weekStart = startOfWeek(dateInWeek);
  const [existing] = await db.select().from(weeks).where(eq(weeks.weekStart, weekStart)).limit(1);
  if (existing) return loadWeekView(db, existing);

  const { template, sessions } = await getTemplate(db, "base");
  const generated = generateWeek({ weekStart, template: sessions, calendar: planCalendar });
  const locIds = await locationIdsByKey(db);

  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(weeks)
      .values({
        weekStart,
        templateId: template.id,
        isDeload: generated.isDeload,
        isDietBreak: generated.isDietBreak,
      })
      .onConflictDoNothing({ target: weeks.weekStart })
      .returning({ id: weeks.id });
    if (!inserted[0]) return; // another request created it first
    await tx.insert(plannedSessions).values(
      generated.sessions.map((s) => ({
        weekId: inserted[0].id,
        date: s.date,
        sessionType: s.sessionType,
        title: s.title,
        startTime: s.startTime,
        endTime: s.endTime,
        locationId: s.locationKey ? (locIds.get(s.locationKey) ?? null) : null,
        notes: s.notes,
        status: s.status,
        sortOrder: s.sortOrder,
      })),
    );
  });

  const [week] = await db.select().from(weeks).where(eq(weeks.weekStart, weekStart)).limit(1);
  return loadWeekView(db, week);
}

/**
 * Switches a week between the base and Tuesday-frisbee templates. Statuses
 * survive where the same session stays on the same date; done sessions that
 * the new template no longer has are kept as extra rows and reported.
 */
export async function setWeekTemplate(
  dateInWeek: LocalDate,
  key: TemplateKey,
  db: Db = getDb(),
): Promise<{ view: WeekView; keptDone: PlannedSessionView[] }> {
  const current = await getOrCreateWeek(dateInWeek, db);
  if (current.templateKey === key) return { view: current, keptDone: [] };

  const { template, sessions } = await getTemplate(db, key);
  const generated = generateWeek({ weekStart: current.week.weekStart, template: sessions, calendar: planCalendar });
  const merged = mergeStatuses(current.sessions, generated.sessions);
  const keptDone = doneSessionsLostBy(current.sessions, generated.sessions);
  const keptIds = new Set(keptDone.map((s) => s.id));
  const locIds = await locationIdsByKey(db);

  await db.transaction(async (tx) => {
    const toDelete = current.sessions.filter((s) => !keptIds.has(s.id)).map((s) => s.id);
    if (toDelete.length) await tx.delete(plannedSessions).where(inArray(plannedSessions.id, toDelete));
    await tx.insert(plannedSessions).values(
      merged.map((s) => ({
        weekId: current.week.id,
        date: s.date,
        sessionType: s.sessionType,
        title: s.title,
        startTime: s.startTime,
        endTime: s.endTime,
        locationId: s.locationKey ? (locIds.get(s.locationKey) ?? null) : null,
        notes: s.notes,
        status: s.status,
        loggedAt: s.status === "planned" ? null : new Date(),
        sortOrder: s.sortOrder,
      })),
    );
    await tx.update(weeks).set({ templateId: template.id, updatedAt: new Date() }).where(eq(weeks.id, current.week.id));
  });

  const [week] = await db.select().from(weeks).where(eq(weeks.id, current.week.id)).limit(1);
  return { view: await loadWeekView(db, week), keptDone };
}

export async function setSessionStatus(
  id: string,
  status: Exclude<SessionStatus, "moved">,
  db: Db = getDb(),
): Promise<PlannedSession | undefined> {
  const [row] = await db
    .update(plannedSessions)
    .set({ status, movedToDate: null, loggedAt: status === "planned" ? null : new Date() })
    .where(eq(plannedSessions.id, id))
    .returning();
  return row;
}

/**
 * Marks a session as moved and plans a copy on the target date (creating that
 * week if needed). Moving to the same date is a no-op.
 */
export async function moveSession(id: string, toDate: LocalDate, db: Db = getDb()): Promise<void> {
  const [session] = await db.select().from(plannedSessions).where(eq(plannedSessions.id, id)).limit(1);
  if (!session || session.date === toDate) return;
  const target = await getOrCreateWeek(toDate, db);
  await db.transaction(async (tx) => {
    await tx
      .update(plannedSessions)
      .set({ status: "moved", movedToDate: toDate, loggedAt: new Date() })
      .where(eq(plannedSessions.id, id));
    await tx.insert(plannedSessions).values({
      weekId: target.week.id,
      date: toDate,
      sessionType: session.sessionType,
      title: session.title,
      startTime: session.startTime,
      endTime: session.endTime,
      locationId: session.locationId,
      notes: session.notes,
      status: "planned",
      sortOrder: 50,
    });
  });
}

/** Removes a moved-in copy and restores the original when the user undoes a move. */
export async function undoMove(id: string, db: Db = getDb()): Promise<void> {
  const [session] = await db.select().from(plannedSessions).where(eq(plannedSessions.id, id)).limit(1);
  if (!session || session.status !== "moved" || !session.movedToDate) return;
  await db.transaction(async (tx) => {
    const copies = await tx
      .select({ id: plannedSessions.id })
      .from(plannedSessions)
      .where(
        and(
          eq(plannedSessions.date, session.movedToDate!),
          eq(plannedSessions.sessionType, session.sessionType),
          eq(plannedSessions.status, "planned"),
          ne(plannedSessions.id, id),
        ),
      )
      .limit(1);
    if (copies[0]) await tx.delete(plannedSessions).where(eq(plannedSessions.id, copies[0].id));
    await tx
      .update(plannedSessions)
      .set({ status: "planned", movedToDate: null, loggedAt: null })
      .where(eq(plannedSessions.id, id));
  });
}

export async function getDayTypeOverride(date: LocalDate, db: Db = getDb()): Promise<DayType | null> {
  const [row] = await db.select().from(dayTypeOverrides).where(eq(dayTypeOverrides.date, date)).limit(1);
  return row?.dayType ?? null;
}

export async function setDayTypeOverride(date: LocalDate, dayType: DayType | null, db: Db = getDb()): Promise<void> {
  if (!dayType) {
    await db.delete(dayTypeOverrides).where(eq(dayTypeOverrides.date, date));
    return;
  }
  await db
    .insert(dayTypeOverrides)
    .values({ date, dayType })
    .onConflictDoUpdate({ target: dayTypeOverrides.date, set: { dayType } });
}

export async function getAllTargets(db: Db = getDb()) {
  return db.select().from(targets);
}
