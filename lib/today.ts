import "server-only";
import { isLocalDate, localTimeInStockholm, todayInStockholm, type LocalDate, type LocalTime } from "@/lib/rules";

export interface Clock {
  today: LocalDate;
  time: LocalTime;
  /** True when the date came from the ?date= override. */
  overridden: boolean;
}

/**
 * The current Stockholm date and time. Outside production (or with
 * FORMKOLL_ALLOW_DATE_OVERRIDE=1) a `?date=YYYY-MM-DD&time=HH:MM` query
 * overrides them, which the end-to-end tests rely on.
 */
export function resolveClock(params: { date?: string | string[]; time?: string | string[] } = {}): Clock {
  const allow = process.env.NODE_ENV !== "production" || process.env.FORMKOLL_ALLOW_DATE_OVERRIDE === "1";
  const date = Array.isArray(params.date) ? params.date[0] : params.date;
  const time = Array.isArray(params.time) ? params.time[0] : params.time;
  if (allow && date && isLocalDate(date)) {
    return { today: date, time: time && /^\d{2}:\d{2}$/.test(time) ? time : localTimeInStockholm(), overridden: true };
  }
  return { today: todayInStockholm(), time: localTimeInStockholm(), overridden: false };
}
