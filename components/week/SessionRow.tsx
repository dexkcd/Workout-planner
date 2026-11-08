import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import type { PlannedSessionView } from "@/lib/db/queries/schedule";
import { SESSION_SHORT_LABEL, locationShortName } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { dayOfMonth, formatDayMonth, weekdayShort, type LocalDate } from "@/lib/rules";

interface Props {
  session: PlannedSessionView;
  today: LocalDate;
  /** Hide the weekday column for the 2nd+ session on the same date. */
  showDay: boolean;
}

export function SessionRow({ session, today, showDay }: Props) {
  const isToday = session.date === today;
  const isRestLike = session.sessionType === "rest" || session.sessionType === "walk";
  const details = [
    session.startTime ? session.startTime : session.sessionType === "gym_a" ? "Lunch" : session.sessionType === "gym_b" ? "Late morning" : null,
    locationShortName(session.location?.key, session.location?.name),
    !session.location && session.notes ? session.notes : null,
  ].filter(Boolean);

  const status =
    session.status === "done" ? (
      <span className="flex items-center gap-1 text-[13px] font-semibold text-primary">
        <CheckIcon size={16} />
        Done
      </span>
    ) : session.status === "skipped" ? (
      <span className="text-[13px] text-dim">Skipped</span>
    ) : session.status === "moved" ? (
      <span className="text-[13px] text-dim">→ {session.movedToDate ? formatDayMonth(session.movedToDate) : "moved"}</span>
    ) : isToday ? (
      <span className="text-[13px] font-semibold text-primary">Today</span>
    ) : (
      <span className="text-[13px] text-dim">{isRestLike ? "Rest day" : "Planned"}</span>
    );

  const inner = (
    <>
      <span className="flex w-10 flex-col text-[12px] text-dim">
        {showDay ? (
          <>
            <span>{weekdayShort(session.date)}</span>
            <span className="num text-[17px] font-semibold text-foreground">{dayOfMonth(session.date)}</span>
          </>
        ) : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("text-[15px] font-semibold", session.status === "moved" && "line-through opacity-70")}>
          {SESSION_SHORT_LABEL[session.sessionType]}
        </span>
        <span className="truncate text-[12px] text-dim">{details.join(" · ")}</span>
      </span>
      {status}
    </>
  );

  const className = cn(
    "flex min-h-[60px] items-center gap-3.5 rounded-[16px] px-3.5 py-2.5 text-foreground no-underline",
    isRestLike && !isToday ? "border border-dashed border-border" : "bg-surface",
    isToday && "border-[1.5px] border-primary bg-surface-2",
  );

  return (
    <li data-date={session.date} data-session-type={session.sessionType} data-status={session.status}>
      {isToday ? (
        <Link href={`/today?date=${session.date}`} className={className}>
          {inner}
        </Link>
      ) : (
        <div className={className}>{inner}</div>
      )}
    </li>
  );
}
