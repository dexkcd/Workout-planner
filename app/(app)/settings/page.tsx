import { asc, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { passkeyCredentials, targets } from "@/lib/db/schema";
import { AddPasskeyButton } from "@/components/auth/PasskeyButtons";
import { BackHeader } from "@/components/nav/BackHeader";
import { formatDayMonth } from "@/lib/rules/time";
import { formatInt } from "@/lib/format";

export const metadata = { title: "Settings" };

const DAY_TYPE_LABEL = { training: "Training day", rest: "Rest day", break: "Diet break" } as const;

export default async function SettingsPage() {
  const user = await requireUser();
  const db = getDb();
  const [targetRows, passkeys] = await Promise.all([
    db.select().from(targets).orderBy(desc(targets.effectiveFrom), asc(targets.dayType)),
    db.select().from(passkeyCredentials).orderBy(asc(passkeyCredentials.createdAt)),
  ]);

  return (
    <>
      <BackHeader backHref="/today" backLabel="Today" title="Settings" subtitle={user.email} />

      <section aria-labelledby="h-targets" className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
        <h2 id="h-targets" className="m-0 text-[15px] font-semibold">
          Targets
        </h2>
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="text-left text-[12px] text-dim">
              <th className="py-1 font-medium">From</th>
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 text-right font-medium">kcal</th>
              <th className="py-1 text-right font-medium">Protein</th>
            </tr>
          </thead>
          <tbody>
            {targetRows.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="py-2">{formatDayMonth(t.effectiveFrom)}</td>
                <td className="py-2">{DAY_TYPE_LABEL[t.dayType]}</td>
                <td className="num py-2 text-right font-semibold">{formatInt(t.kcal)}</td>
                <td className="num py-2 text-right font-semibold">{t.proteinG} g</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="m-0 text-[12px] text-dim">Targets are never edited; accepting an adjustment adds a new row from the next day.</p>
      </section>

      <section aria-labelledby="h-passkeys" className="flex flex-col gap-3 rounded-[20px] bg-surface p-4">
        <h2 id="h-passkeys" className="m-0 text-[15px] font-semibold">
          Passkeys
        </h2>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[14px]">
          {passkeys.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3">
              <span>{p.label ?? "Passkey"}</span>
              <span className="text-[12px] text-dim">
                {p.lastUsedAt ? `used ${formatDayMonth(p.lastUsedAt.toISOString().slice(0, 10))}` : "never used"}
              </span>
            </li>
          ))}
        </ul>
        <AddPasskeyButton />
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="h-11 w-full rounded-[12px] border border-border text-[14px] font-medium">
            Sign out
          </button>
        </form>
      </section>

      <section aria-labelledby="h-about" className="flex flex-col gap-2 rounded-[20px] bg-surface p-4">
        <h2 id="h-about" className="m-0 text-[15px] font-semibold">
          About
        </h2>
        <p className="m-0 text-[13px] text-dim">
          Formkoll runs one person&apos;s winter training and diet plan. Times are Europe/Stockholm and weeks start on
          Monday.
        </p>
        <p className="m-0 text-[13px] text-dim">
          Food composition data will come from Livsmedelsverket (the Swedish Food Agency), licensed CC BY 4.0, and
          from Open Food Facts.
        </p>
      </section>
    </>
  );
}
