import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  eyebrow?: ReactNode;
  title: ReactNode;
  initial?: string;
  /** Right-hand slot; defaults to the settings avatar when `initial` is given. */
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, initial, action }: Props) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        {eyebrow ? <span className="text-[13px] font-medium text-dim">{eyebrow}</span> : null}
        <h1 className="m-0 text-[30px] leading-tight font-bold tracking-[-0.01em]">{title}</h1>
      </div>
      {action ??
        (initial ? (
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-[15px] font-semibold"
          >
            {initial}
          </Link>
        ) : null)}
    </header>
  );
}
