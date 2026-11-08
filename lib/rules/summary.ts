import { TRAINING_SESSION_TYPES, type SessionLike } from "./types";

export interface WeekSummary {
  /** Training sessions in the week that were not moved away. */
  planned: number;
  done: number;
  skipped: number;
}

/** Counts gym, climbing and frisbee sessions; rest days and walks are not sessions. */
export function weekSummary(sessions: readonly SessionLike[]): WeekSummary {
  const training = sessions.filter((s) => TRAINING_SESSION_TYPES.includes(s.sessionType));
  return {
    planned: training.filter((s) => s.status !== "moved").length,
    done: training.filter((s) => s.status === "done").length,
    skipped: training.filter((s) => s.status === "skipped").length,
  };
}
