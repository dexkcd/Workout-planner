import type { SessionStatus, SessionType } from "@/lib/rules/types";

/** Short row labels, as in the Week mockup. */
export const SESSION_SHORT_LABEL: Record<SessionType, string> = {
  climb_hard: "Bouldering 1 · hard",
  climb_volume: "Bouldering 2 · volume",
  gym_a: "Gym A · strength",
  gym_b: "Gym B · power",
  gym_full: "Gym · full body",
  frisbee: "Ultimate frisbee",
  walk: "Walk + batch cook",
  rest: "Rest",
};

/** Card titles, as in the Today mockup. */
export const SESSION_CARD_TITLE: Record<SessionType, string> = {
  climb_hard: "Bouldering 1",
  climb_volume: "Bouldering 2",
  gym_a: "Gym A",
  gym_b: "Gym B",
  gym_full: "Gym · full body",
  frisbee: "Ultimate frisbee",
  walk: "Long walk",
  rest: "Rest",
};

export const SESSION_CARD_SUBTITLE: Record<SessionType, string> = {
  climb_hard: "Hard problems",
  climb_volume: "Volume and technique",
  gym_a: "Strength",
  gym_b: "Power and conditioning",
  gym_full: "First 4 of Gym A, then jumps and sprints",
  frisbee: "Kanalhallen, Skanstull",
  walk: "60–90 min outdoors in daylight",
  rest: "Rest day",
};

export const STATUS_LABEL: Record<SessionStatus, string> = {
  planned: "Planned",
  done: "Done",
  skipped: "Skipped",
  moved: "Moved",
};

/** Short place names for subtitles. */
export const LOCATION_SHORT_NAME: Record<string, string> = {
  klattercentret_telefonplan: "Telefonplan",
  kanalhallen: "Kanalhallen",
  f247_hotorget: "Fitness24Seven Hötorget",
  f247_sodertalje_centrum: "Södertälje Centrum",
};

export function locationShortName(key: string | null | undefined, fallback: string | null | undefined): string | null {
  if (key && LOCATION_SHORT_NAME[key]) return LOCATION_SHORT_NAME[key];
  return fallback ?? null;
}
