import Link from "next/link";
import { CloudOffIcon } from "@/components/icons";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-surface text-dim">
        <CloudOffIcon size={30} />
      </span>
      <h1 className="m-0 text-[26px] font-bold">You&apos;re offline</h1>
      <p className="m-0 text-[15px] text-dim">
        This page isn&apos;t cached yet. Today&apos;s screen keeps working once it has been opened online.
      </p>
      <Link href="/today" className="flex h-12 items-center rounded-[14px] bg-primary px-5 font-semibold text-primary-foreground">
        Try again
      </Link>
    </main>
  );
}
