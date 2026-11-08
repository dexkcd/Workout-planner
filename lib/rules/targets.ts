import type { DayType, LocalDate, TargetRow } from "./types";

/**
 * The target row in effect for a date and day type: the latest row whose
 * `effectiveFrom` is on or before the date. Rows are never edited, so past
 * days keep the targets they had.
 */
export function targetsFor<T extends TargetRow>(date: LocalDate, dayType: DayType, rows: readonly T[]): T | undefined {
  let best: T | undefined;
  for (const row of rows) {
    if (row.dayType !== dayType || row.effectiveFrom > date) continue;
    if (!best || row.effectiveFrom > best.effectiveFrom) best = row;
  }
  return best;
}

export interface Remaining {
  kcalLeft: number;
  proteinLeft: number;
  overKcal: boolean;
  overProtein: boolean;
}

export function remaining(target: Pick<TargetRow, "kcal" | "proteinG">, eatenKcal: number, eatenProteinG: number): Remaining {
  const kcalLeft = target.kcal - eatenKcal;
  const proteinLeft = target.proteinG - eatenProteinG;
  return { kcalLeft, proteinLeft, overKcal: kcalLeft < 0, overProtein: proteinLeft < 0 };
}
