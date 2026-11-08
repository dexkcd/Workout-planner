"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BagIcon, BowlIcon, CalendarIcon, HomeIcon, PulseIcon } from "@/components/icons";

const TABS = [
  { href: "/today", label: "Today", Icon: HomeIcon },
  { href: "/week", label: "Week", Icon: CalendarIcon },
  { href: "/food", label: "Food", Icon: BowlIcon },
  { href: "/body", label: "Body", Icon: PulseIcon },
  { href: "/shop", label: "Shop", Icon: BagIcon },
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex items-start justify-around border-t border-border bg-nav pt-2 pb-[max(env(safe-area-inset-bottom),12px)]"
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-12 w-16 flex-col items-center gap-1 text-[11px]",
              active ? "font-semibold text-primary" : "font-medium text-dim",
            )}
          >
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
