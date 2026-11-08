import Link from "next/link";
import { formatInt } from "@/lib/format";

interface Props {
  time: string | null;
  slotLabel: string;
  description: string;
  kcal: number;
  proteinG: number;
}

export function NextMeal({ time, slotLabel, description, kcal, proteinG }: Props) {
  return (
    <article className="flex items-center gap-3.5 rounded-[20px] bg-surface px-4 py-3.5">
      <span className="num w-[52px] text-[17px] font-semibold">{time ?? "—"}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{slotLabel}</span>
        <span className="text-[13px] text-dim">
          {description} · {formatInt(kcal)} kcal · {proteinG} g
        </span>
      </div>
      <Link
        href="/food"
        className="flex h-11 items-center rounded-[12px] bg-surface-2 px-4 text-[14px] font-semibold text-foreground no-underline"
      >
        Log
      </Link>
    </article>
  );
}
