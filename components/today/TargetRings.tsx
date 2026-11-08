import { formatInt } from "@/lib/format";

interface Props {
  kcal: number;
  kcalTarget: number;
  protein: number;
  proteinTarget: number;
}

const R_OUTER = 52;
const R_INNER = 37;

function arc(r: number, fraction: number): string {
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraction));
  return `${(c * f).toFixed(1)} ${(c * (1 - f)).toFixed(1)}`;
}

/** Calorie (outer, accent) and protein (inner, attention) rings, like the mockup. */
export function TargetRings({ kcal, kcalTarget, protein, proteinTarget }: Props) {
  const kcalLeft = kcalTarget - kcal;
  const proteinLeft = proteinTarget - protein;
  const over = kcalLeft < 0;
  const label = `${formatInt(kcal)} of ${formatInt(kcalTarget)} kcal and ${protein} of ${proteinTarget} grams protein eaten`;
  return (
    <section aria-label="Today's targets" className="flex items-center gap-[18px] rounded-[20px] bg-surface p-[18px]">
      <svg role="img" aria-label={label} width="104" height="104" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={R_OUTER} fill="none" className="stroke-track" strokeWidth="11" />
        <circle
          cx="60"
          cy="60"
          r={R_OUTER}
          fill="none"
          className="stroke-primary"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={arc(R_OUTER, kcalTarget ? kcal / kcalTarget : 0)}
          transform="rotate(-90 60 60)"
        />
        <circle cx="60" cy="60" r={R_INNER} fill="none" className="stroke-track" strokeWidth="11" />
        <circle
          cx="60"
          cy="60"
          r={R_INNER}
          fill="none"
          className="stroke-attention"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={arc(R_INNER, proteinTarget ? protein / proteinTarget : 0)}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="flex flex-1 flex-col gap-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-[12px] text-dim">
            <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
            Calories
          </span>
          <span className="num text-[22px] font-semibold">
            {formatInt(kcal)} <span className="text-[14px] font-medium text-dim">/ {formatInt(kcalTarget)} kcal</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-[12px] text-dim">
            <span aria-hidden="true" className="size-2 rounded-full bg-attention" />
            Protein
          </span>
          <span className="num text-[22px] font-semibold">
            {protein} <span className="text-[14px] font-medium text-dim">/ {proteinTarget} g</span>
          </span>
        </div>
        <span className={over ? "text-[13px] font-medium text-attention" : "text-[13px] text-dim"}>
          {over
            ? `${formatInt(-kcalLeft)} kcal over target`
            : `${formatInt(kcalLeft)} kcal and ${Math.max(0, proteinLeft)} g protein left`}
        </span>
      </div>
    </section>
  );
}
