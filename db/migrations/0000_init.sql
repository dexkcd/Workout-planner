CREATE TYPE "public"."day_type" AS ENUM('training', 'rest', 'break');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('planned', 'done', 'skipped', 'moved');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('climb_hard', 'climb_volume', 'gym_a', 'gym_b', 'gym_full', 'frisbee', 'walk', 'rest');--> statement-breakpoint
CREATE TYPE "public"."target_source" AS ENUM('seed', 'manual', 'adjustment');--> statement-breakpoint
CREATE TABLE "day_type_overrides" (
	"date" date PRIMARY KEY NOT NULL,
	"day_type" "day_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"notes" text,
	CONSTRAINT "locations_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "passkey_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"public_key" text NOT NULL,
	"counter" bigint DEFAULT 0 NOT NULL,
	"transports" text[],
	"device_type" text,
	"backed_up" boolean DEFAULT false NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "planned_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_id" uuid NOT NULL,
	"date" date NOT NULL,
	"session_type" "session_type" NOT NULL,
	"title" text NOT NULL,
	"start_time" time,
	"end_time" time,
	"location_id" uuid,
	"notes" text,
	"status" "session_status" DEFAULT 'planned' NOT NULL,
	"moved_to_date" date,
	"logged_at" timestamp with time zone,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "schedule_templates_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"effective_from" date NOT NULL,
	"day_type" "day_type" NOT NULL,
	"kcal" integer NOT NULL,
	"protein_g" integer NOT NULL,
	"carbs_g" integer,
	"fat_g" integer,
	"source" "target_source" DEFAULT 'manual' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"session_type" "session_type" NOT NULL,
	"title" text NOT NULL,
	"start_time" time,
	"end_time" time,
	"location_id" uuid,
	"notes" text,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weeks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_start" date NOT NULL,
	"template_id" uuid NOT NULL,
	"is_deload" boolean DEFAULT false NOT NULL,
	"is_diet_break" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weeks_week_start_unique" UNIQUE("week_start")
);
--> statement-breakpoint
ALTER TABLE "passkey_credentials" ADD CONSTRAINT "passkey_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_sessions" ADD CONSTRAINT "planned_sessions_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_sessions" ADD CONSTRAINT "planned_sessions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_sessions" ADD CONSTRAINT "template_sessions_template_id_schedule_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."schedule_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_sessions" ADD CONSTRAINT "template_sessions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weeks" ADD CONSTRAINT "weeks_template_id_schedule_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."schedule_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "planned_sessions_date_idx" ON "planned_sessions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "planned_sessions_week_idx" ON "planned_sessions" USING btree ("week_id");--> statement-breakpoint
CREATE UNIQUE INDEX "targets_effective_from_day_type_idx" ON "targets" USING btree ("effective_from","day_type");--> statement-breakpoint
CREATE UNIQUE INDEX "template_sessions_template_weekday_order_idx" ON "template_sessions" USING btree ("template_id","weekday","sort_order");