import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "@/components/icons";

interface Props {
  backHref: string;
  backLabel: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

/** Header for pushed screens: back link on the left, optional action on the right. */
export function BackHeader({ backHref, backLabel, title, subtitle, action }: Props) {
  return (
    <header className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <Link href={backHref} className="flex min-h-11 w-24 items-center gap-1 text-[15px] font-medium text-primary">
          <ChevronLeftIcon size={20} />
          {backLabel}
        </Link>
        {action}
      </div>
      <div className="flex flex-col gap-0.5">
        <h1 className="m-0 text-[26px] leading-tight font-bold">{title}</h1>
        {subtitle ? <span className="text-[13px] text-dim">{subtitle}</span> : null}
      </div>
    </header>
  );
}
