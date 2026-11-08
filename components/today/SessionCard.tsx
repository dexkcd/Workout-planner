import { CheckIcon } from "@/components/icons";
import { MoveSessionButton } from "@/components/today/MoveSessionButton";
import { markSessionAction, undoMoveAction } from "@/lib/actions/schedule";
import type { PlannedSessionView } from "@/lib/db/queries/schedule";
import { SESSION_CARD_SUBTITLE, SESSION_CARD_TITLE } from "@/lib/labels";
import { formatDayMonth, formatTimeRange, type LocalDate } from "@/lib/rules";

interface Props {
  session: PlannedSessionView;
  today: LocalDate;
}

export function SessionCard({ session, today }: Props) {
  const isRest = session.sessionType === "rest";
  const time = formatTimeRange(session.startTime, session.endTime);
  const title = SESSION_CARD_TITLE[session.sessionType];
  const subtitle = session.title.includes(":") ? session.title.split(":")[1].trim() : SESSION_CARD_SUBTITLE[session.sessionType];

  return (
    <article className="flex flex-col gap-3 rounded-[20px] bg-surface p-[18px]" data-session-type={session.sessionType}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="m-0 text-[20px] font-semibold">{title}</h3>
          <span className="text-[14px] text-dim">{subtitle.charAt(0).toUpperCase() + subtitle.slice(1)}</span>
        </div>
        {session.startTime ? <span className="num text-[18px] font-semibold">{session.startTime}</span> : null}
      </div>

      {session.location || session.notes || time.includes("–") ? (
        <dl className="m-0 grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[14px]">
          {session.location ? (
            <>
              <dt className="text-dim">Where</dt>
              <dd className="m-0">{session.location.name}</dd>
            </>
          ) : null}
          {time.includes("–") ? (
            <>
              <dt className="text-dim">When</dt>
              <dd className="m-0">{time}</dd>
            </>
          ) : null}
          {session.notes ? (
            <>
              <dt className="text-dim">Notes</dt>
              <dd className="m-0">{session.notes}</dd>
            </>
          ) : null}
        </dl>
      ) : null}

      {isRest ? null : session.status === "planned" ? (
        <div className="flex gap-2.5">
          <form action={markSessionAction} className="flex flex-1">
            <input type="hidden" name="id" value={session.id} />
            <input type="hidden" name="status" value="done" />
            <button
              type="submit"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-primary text-[15px] font-semibold text-primary-foreground"
            >
              <CheckIcon size={18} />
              Done
            </button>
          </form>
          <form action={markSessionAction}>
            <input type="hidden" name="id" value={session.id} />
            <input type="hidden" name="status" value="skipped" />
            <button type="submit" className="h-12 rounded-[14px] border border-border px-[18px] text-[15px] font-medium">
              Skip
            </button>
          </form>
          <MoveSessionButton sessionId={session.id} fromDate={session.date} today={today} />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <span
            className={
              session.status === "done"
                ? "flex items-center gap-1.5 text-[14px] font-semibold text-primary"
                : "text-[14px] font-medium text-dim"
            }
          >
            {session.status === "done" ? <CheckIcon size={16} /> : null}
            {session.status === "done"
              ? "Done"
              : session.status === "skipped"
                ? "Skipped"
                : `Moved to ${session.movedToDate ? formatDayMonth(session.movedToDate) : "another day"}`}
          </span>
          <form action={session.status === "moved" ? undoMoveAction : markSessionAction}>
            <input type="hidden" name="id" value={session.id} />
            <input type="hidden" name="status" value="planned" />
            <button type="submit" className="h-11 rounded-[12px] border border-border px-4 text-[14px] font-medium">
              Undo
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
