"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { moveSessionAction } from "@/lib/actions/schedule";
import { addDays, formatDayMonth, weekdayLong } from "@/lib/rules/time";
import type { LocalDate } from "@/lib/rules/types";

interface Props {
  sessionId: string;
  fromDate: LocalDate;
  today: LocalDate;
}

/** "Moved": pick one of the next days in a bottom sheet. */
export function MoveSessionButton({ sessionId, fromDate, today }: Props) {
  const [open, setOpen] = useState(false);
  const start = today > fromDate ? today : fromDate;
  const options = Array.from({ length: 7 }, (_, i) => addDays(start, i + 1)).filter((d) => d !== fromDate);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<button type="button" className="h-12 rounded-[14px] border border-border px-[18px] text-[15px] font-medium" />}
      >
        Move
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-[20px] bg-surface px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
        <SheetHeader className="px-0">
          <SheetTitle className="text-[18px] font-semibold">Move to</SheetTitle>
        </SheetHeader>
        <form action={moveSessionAction} className="flex flex-col gap-2" onSubmit={() => setOpen(false)}>
          <input type="hidden" name="id" value={sessionId} />
          {options.map((d) => (
            <button
              key={d}
              type="submit"
              name="toDate"
              value={d}
              className="flex h-12 items-center justify-between rounded-[12px] bg-surface-2 px-4 text-[15px]"
            >
              <span className="font-medium">{weekdayLong(d)}</span>
              <span className="text-dim">{formatDayMonth(d)}</span>
            </button>
          ))}
        </form>
      </SheetContent>
    </Sheet>
  );
}
