const intFormatter = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const kgFormatter = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** 2400 → "2,400" (matches the mockups). */
export function formatInt(n: number): string {
  return intFormatter.format(n);
}

/** 84.7 → "84.7" */
export function formatKg(n: number): string {
  return kgFormatter.format(n);
}
