import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { DAY_TYPES, SESSION_STATUSES, SESSION_TYPES } from "@/lib/rules/types";

// Enums -----------------------------------------------------------------------

export const dayTypeEnum = pgEnum("day_type", DAY_TYPES);
export const sessionTypeEnum = pgEnum("session_type", SESSION_TYPES);
export const sessionStatusEnum = pgEnum("session_status", SESSION_STATUSES);
export const targetSourceEnum = pgEnum("target_source", ["seed", "manual", "adjustment"]);

const id = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// Core ------------------------------------------------------------------------

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  createdAt: createdAt(),
});

/**
 * WebAuthn credentials. The spec folds these into `users`; a separate table
 * lets one user register a passkey on several devices (phone and laptop).
 */
export const passkeyCredentials = pgTable("passkey_credentials", {
  /** Credential ID, base64url. */
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** COSE public key, base64url. */
  publicKey: text("public_key").notNull(),
  counter: bigint("counter", { mode: "number" }).notNull().default(0),
  transports: text("transports").array(),
  deviceType: text("device_type"),
  backedUp: boolean("backed_up").notNull().default(false),
  label: text("label"),
  createdAt: createdAt(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

/** Append-only. Accepting an adjustment adds a row; old rows are never edited. */
export const targets = pgTable(
  "targets",
  {
    id: id(),
    effectiveFrom: date("effective_from").notNull(),
    dayType: dayTypeEnum("day_type").notNull(),
    kcal: integer("kcal").notNull(),
    proteinG: integer("protein_g").notNull(),
    carbsG: integer("carbs_g"),
    fatG: integer("fat_g"),
    source: targetSourceEnum("source").notNull().default("manual"),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("targets_effective_from_day_type_idx").on(t.effectiveFrom, t.dayType)],
);

// Schedule --------------------------------------------------------------------

export const locations = pgTable("locations", {
  id: id(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  address: text("address"),
  notes: text("notes"),
});

export const scheduleTemplates = pgTable("schedule_templates", {
  id: id(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
});

export const templateSessions = pgTable(
  "template_sessions",
  {
    id: id(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => scheduleTemplates.id, { onDelete: "cascade" }),
    /** ISO weekday, 1 = Monday … 7 = Sunday. */
    weekday: smallint("weekday").notNull(),
    sessionType: sessionTypeEnum("session_type").notNull(),
    title: text("title").notNull(),
    startTime: time("start_time"),
    endTime: time("end_time"),
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
    notes: text("notes"),
    sortOrder: smallint("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("template_sessions_template_weekday_order_idx").on(t.templateId, t.weekday, t.sortOrder)],
);

export const weeks = pgTable("weeks", {
  id: id(),
  /** The Monday, as a local date. */
  weekStart: date("week_start").notNull().unique(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => scheduleTemplates.id),
  isDeload: boolean("is_deload").notNull().default(false),
  isDietBreak: boolean("is_diet_break").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const plannedSessions = pgTable(
  "planned_sessions",
  {
    id: id(),
    weekId: uuid("week_id")
      .notNull()
      .references(() => weeks.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    sessionType: sessionTypeEnum("session_type").notNull(),
    title: text("title").notNull(),
    startTime: time("start_time"),
    endTime: time("end_time"),
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
    notes: text("notes"),
    status: sessionStatusEnum("status").notNull().default("planned"),
    /** Set when status is `moved`. */
    movedToDate: date("moved_to_date"),
    /** When the status was last changed by the user. */
    loggedAt: timestamp("logged_at", { withTimezone: true }),
    sortOrder: smallint("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("planned_sessions_date_idx").on(t.date), index("planned_sessions_week_idx").on(t.weekId)],
);

/** Manual override of the computed day type for one date. */
export const dayTypeOverrides = pgTable("day_type_overrides", {
  date: date("date").primaryKey(),
  dayType: dayTypeEnum("day_type").notNull(),
  createdAt: createdAt(),
});

export type User = typeof users.$inferSelect;
export type PasskeyCredential = typeof passkeyCredentials.$inferSelect;
export type Target = typeof targets.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type ScheduleTemplate = typeof scheduleTemplates.$inferSelect;
export type TemplateSessionRow = typeof templateSessions.$inferSelect;
export type Week = typeof weeks.$inferSelect;
export type PlannedSession = typeof plannedSessions.$inferSelect;
export type DayTypeOverride = typeof dayTypeOverrides.$inferSelect;
