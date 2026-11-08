"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setTuesdayFrisbeeAction } from "@/lib/actions/schedule";

interface Props {
  weekStart: string;
  initial: boolean;
}

export function TuesdayFrisbeeToggle({ weekStart, initial }: Props) {
  const [on, setOn] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: boolean) {
    setOn(next);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await setTuesdayFrisbeeAction(weekStart, next);
        setOn(result.tuesdayFrisbee);
        setMessage(result.message);
      } catch {
        setOn(!next);
        setMessage("Could not change the week. Try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="flex min-h-12 items-center justify-between gap-3 rounded-[16px] bg-surface px-4 py-3">
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold">Tuesday frisbee this week</span>
          <span className="text-[12px] text-dim">Swaps Gym A for frisbee, keeps Wednesday easy</span>
        </span>
        <Switch
          checked={on}
          onCheckedChange={change}
          disabled={pending}
          aria-label="Tuesday frisbee this week"
          className="data-checked:bg-primary data-unchecked:bg-track h-7 w-12 after:hidden"
          size="default"
        />
      </label>
      {message ? (
        <p role="status" className="m-0 px-1 text-[12px] text-attention">
          {message}
        </p>
      ) : null}
    </div>
  );
}
