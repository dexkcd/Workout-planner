import Link from "next/link";
import { PageHeader } from "@/components/nav/PageHeader";
import { DayTypeMenu } from "@/components/today/DayTypeMenu";
import { NextMeal } from "@/components/today/NextMeal";
import { SessionCard } from "@/components/today/SessionCard";
import { TargetRings } from "@/components/today/TargetRings";
import { requireUser } from "@/lib/auth/guard";
import { getAllTargets, getDayTypeOverride, getOrCreateWeek } from "@/lib/db/queries/schedule";
import { plan, planCalendar, weekdayKeyToIso } from "@/lib/plan";
import {
  DAY_TYPE_LABEL,
  dayType as computeDayType,
  formatWeekdayDayMonth,
  isoWeekday,
  nextMeal,
  targetsFor,
  templateForDay,
  weekNumber,
} from "@/lib/rules";
import { resolveClock } from "@/lib/today";

export const metadata = { title: "Today" };

const SLOT_LABEL = Object.fromEntries(plan.meal_slots.map((s) => [s.key, s.label.replace(" (optional)", "")]));

const mealTemplates = plan.meal_templates.map((t) => ({
  key: t.key,
  name: t.name,
  dayType: t.day_type,
  weekdays: t.weekdays.map(weekdayKeyToIso),
  items: t.items.map((i) => ({
    slot: i.slot,
    time: i.time,
    optional: i.optional,
    description: i.description,
    kcal: i.kcal,
    proteinG: i.protein_g,
  })),
}));

export default async function TodayPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const clock = resolveClock(await searchParams);
  const { today, time } = clock;

  const [weekView, override, targetRows] = await Promise.all([
    getOrCreateWeek(today),
    getDayTypeOverride(today),
    getAllTargets(),
  ]);
  const todaysSessions = weekView.sessions.filter((s) => s.date === today);
  const computed = computeDayType({ date: today, sessions: weekView.sessions, override: null, dietBreak: planCalendar.dietBreak });
  const type = computeDayType({ date: today, sessions: weekView.sessions, override, dietBreak: planCalendar.dietBreak });
  const target = targetsFor(today, type, targetRows);

  // Food logging arrives in Milestone 5; until then nothing has been eaten today.
  const eatenKcal = 0;
  const eatenProtein = 0;

  const template = templateForDay(mealTemplates, isoWeekday(today), type);
  const meal = template ? nextMeal(template.items, time) : undefined;

  const flags = [
    weekView.week.isDeload ? "Deload week" : null,
    type === "break" ? null : weekView.week.isDietBreak ? "Diet break week" : null,
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            Week {weekNumber(weekView.week.weekStart, planCalendar.planStart)} · {DAY_TYPE_LABEL[type]}
            {flags.length ? ` · ${flags.join(" · ")}` : ""}
          </>
        }
        title={formatWeekdayDayMonth(today)}
        initial={user.displayName.charAt(0)}
      />

      {target ? (
        <TargetRings kcal={eatenKcal} kcalTarget={target.kcal} protein={eatenProtein} proteinTarget={target.proteinG} />
      ) : (
        <section className="rounded-[20px] bg-surface p-[18px] text-[14px] text-dim">No targets found for this day. Run the seed.</section>
      )}

      <section aria-labelledby="h-session" className="flex flex-col gap-2.5">
        <h2 id="h-session" className="m-0 text-[12px] font-semibold tracking-[0.08em] text-dim uppercase">
          {todaysSessions.length > 1 ? "Sessions" : "Session"}
        </h2>
        {todaysSessions.length === 0 ? (
          <article className="rounded-[20px] bg-surface p-[18px] text-[14px] text-dim">Nothing planned today.</article>
        ) : (
          todaysSessions.map((s) => <SessionCard key={s.id} session={s} today={today} />)
        )}
      </section>

      <DayTypeMenu date={today} computed={computed} override={override} />

      <section aria-labelledby="h-next" className="flex flex-col gap-2.5">
        <h2 id="h-next" className="m-0 text-[12px] font-semibold tracking-[0.08em] text-dim uppercase">
          Up next
        </h2>
        {meal ? (
          <NextMeal
            time={meal.time}
            slotLabel={SLOT_LABEL[meal.slot] ?? meal.slot}
            description={meal.description}
            kcal={meal.kcal}
            proteinG={meal.proteinG}
          />
        ) : (
          <article className="rounded-[20px] bg-surface px-4 py-3.5 text-[14px] text-dim">
            {template ? "No more planned meals today." : "No meal template for this day."}
          </article>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/body" className="flex flex-col gap-1 rounded-[18px] bg-surface px-4 py-3.5 text-foreground no-underline">
          <span className="text-[12px] text-dim">Body</span>
          <span className="num text-[20px] font-semibold">Weigh in</span>
          <span className="text-[12px] text-dim">Milestone 3</span>
        </Link>
        <Link href="/shop" className="flex flex-col gap-1 rounded-[18px] bg-surface px-4 py-3.5 text-foreground no-underline">
          <span className="text-[12px] text-dim">Groceries</span>
          <span className="num text-[20px] font-semibold">Scan receipt</span>
          <span className="text-[12px] text-dim">Milestone 7</span>
        </Link>
      </div>

      {clock.overridden ? (
        <p className="m-0 text-center text-[12px] text-dim">
          Showing {today} {time} (date override). <Link href="/today" className="text-primary">Back to now</Link>
        </p>
      ) : null}
    </>
  );
}
