import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { SessionRow } from "@/components/week/SessionRow";
import { TuesdayFrisbeeToggle } from "@/components/week/TuesdayFrisbeeToggle";
import { requireUser } from "@/lib/auth/guard";
import { getOrCreateWeek } from "@/lib/db/queries/schedule";
import { planCalendar } from "@/lib/plan";
import {
  addDays,
  formatWeekRange,
  isDeloadWeek,
  isLocalDate,
  startOfWeek,
  weekNumber,
  weekSummary,
} from "@/lib/rules";
import { resolveClock } from "@/lib/today";

export const metadata = { title: "Week" };

export default async function WeekPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const params = await searchParams;
  const clock = resolveClock(params);
  const requested = Array.isArray(params.week) ? params.week[0] : params.week;
  const weekStart = startOfWeek(requested && isLocalDate(requested) ? requested : clock.today);

  const view = await getOrCreateWeek(weekStart);
  const n = weekNumber(weekStart, planCalendar.planStart);
  const nextIsDeload = isDeloadWeek(addDays(weekStart, 7), planCalendar.planStart, planCalendar.deloadEveryNWeeks);
  const summary = weekSummary(view.sessions);

  const subtitleBits = [
    formatWeekRange(weekStart),
    view.week.isDietBreak ? "diet break" : null,
    view.week.isDeload ? "deload week" : nextIsDeload ? "deload next week" : null,
  ].filter(Boolean);

  const dateQuery = clock.overridden ? `&date=${clock.today}` : "";
  const rows = view.sessions.map((s, i) => ({ session: s, showDay: i === 0 || view.sessions[i - 1].date !== s.date }));

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <Link
          href={`/week?week=${addDays(weekStart, -7)}${dateQuery}`}
          aria-label="Previous week"
          className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-foreground"
        >
          <ChevronLeftIcon size={20} />
        </Link>
        <div className="flex flex-col items-center gap-0.5">
          <h1 className="m-0 text-[26px] font-bold">Week {n}</h1>
          <span className="text-[13px] text-dim">{subtitleBits.join(" · ")}</span>
        </div>
        <Link
          href={`/week?week=${addDays(weekStart, 7)}${dateQuery}`}
          aria-label="Next week"
          className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-foreground"
        >
          <ChevronRightIcon size={20} />
        </Link>
      </header>

      <TuesdayFrisbeeToggle key={`${weekStart}-${view.templateKey}`} weekStart={weekStart} initial={view.templateKey === "tuesday_frisbee"} />

      <ol aria-label="Sessions this week" className="m-0 flex list-none flex-col gap-2 p-0">
        {rows.map(({ session, showDay }) => (
          <SessionRow key={session.id} session={session} today={clock.today} showDay={showDay} />
        ))}
      </ol>

      <section aria-label="Week so far" className="grid grid-cols-3 gap-2 rounded-[18px] bg-surface px-4 py-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] text-dim">Sessions</span>
          <span className="num text-[20px] font-semibold">
            {summary.done} <span className="text-[13px] font-medium text-dim">of {summary.planned}</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] text-dim">Avg protein</span>
          <span className="num text-[20px] font-semibold">
            — <span className="text-[13px] font-medium text-dim">g</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] text-dim">Weight avg</span>
          <span className="num text-[20px] font-semibold">
            — <span className="text-[13px] font-medium text-dim">kg</span>
          </span>
        </div>
      </section>
      <p className="m-0 text-center text-[12px] text-dim">Protein and weight averages arrive with the Food and Body milestones.</p>
    </>
  );
}
