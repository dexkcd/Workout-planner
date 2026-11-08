import type { IsoWeekday, LocalDate, LocalTime } from "./types";

export const TIMEZONE = "Europe/Stockholm";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Calendar date of `now` in the given IANA timezone.
 * This is the only place a Date is turned into a LocalDate.
 */
export function todayIn(timeZone: string, now: Date = new Date()): LocalDate {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function todayInStockholm(now: Date = new Date()): LocalDate {
  return todayIn(TIMEZONE, now);
}

/** Wall-clock time (HH:MM) of `now` in the given timezone. */
export function localTimeIn(timeZone: string, now: Date = new Date()): LocalTime {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("hour")}:${get("minute")}`;
}

export function localTimeInStockholm(now: Date = new Date()): LocalTime {
  return localTimeIn(TIMEZONE, now);
}

export function isLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== "string") return false;
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  // Round-trip through the day number to reject e.g. 2027-02-30.
  return fromDayNumber(toDayNumber(value)) === value;
}

export function assertLocalDate(value: string): LocalDate {
  if (!isLocalDate(value)) throw new Error(`Not a YYYY-MM-DD date: ${value}`);
  return value;
}

/**
 * Days since 1970-01-01 for a calendar date. Uses UTC arithmetic on the
 * Y/M/D fields only, so timezones and DST never enter into it.
 */
export function toDayNumber(date: LocalDate): number {
  const m = DATE_RE.exec(date);
  if (!m) throw new Error(`Not a YYYY-MM-DD date: ${date}`);
  return Math.round(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000);
}

export function fromDayNumber(day: number): LocalDate {
  const d = new Date(day * 86_400_000);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromDayNumber(toDayNumber(date) + days);
}

/** `to - from` in whole days; positive when `to` is later. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return toDayNumber(to) - toDayNumber(from);
}

/** ISO weekday, Monday = 1 … Sunday = 7. 1970-01-01 was a Thursday. */
export function isoWeekday(date: LocalDate): IsoWeekday {
  const n = toDayNumber(date);
  return ((((n + 3) % 7) + 7) % 7 + 1) as IsoWeekday;
}

/** The Monday of the week containing `date`. */
export function startOfWeek(date: LocalDate): LocalDate {
  return addDays(date, 1 - isoWeekday(date));
}

export function endOfWeek(date: LocalDate): LocalDate {
  return addDays(startOfWeek(date), 6);
}

/** Inclusive range check. ISO dates compare correctly as strings. */
export function isBetween(date: LocalDate, from: LocalDate, to: LocalDate): boolean {
  return date >= from && date <= to;
}

export function compareDates(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function maxDate(a: LocalDate, b: LocalDate): LocalDate {
  return a >= b ? a : b;
}

/** Seven dates, Monday to Sunday, for the week starting at `weekStart`. */
export function weekDates(weekStart: LocalDate): LocalDate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/** Minutes since midnight for an HH:MM string. */
export function timeToMinutes(time: LocalTime): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function dayOfMonth(date: LocalDate): number {
  return Number(date.slice(8, 10));
}

export function monthShort(date: LocalDate): string {
  return MONTHS_SHORT[Number(date.slice(5, 7)) - 1];
}

export function weekdayShort(date: LocalDate): string {
  return WEEKDAYS_SHORT[isoWeekday(date) - 1];
}

export function weekdayLong(date: LocalDate): string {
  return WEEKDAYS_LONG[isoWeekday(date) - 1];
}

/** "20 Jan" */
export function formatDayMonth(date: LocalDate): string {
  return `${dayOfMonth(date)} ${monthShort(date)}`;
}

/** "Wednesday 20 Jan" */
export function formatWeekdayDayMonth(date: LocalDate): string {
  return `${weekdayLong(date)} ${formatDayMonth(date)}`;
}

/** "18–24 Jan" or "30 Nov – 6 Dec" for a Monday-start week. */
export function formatWeekRange(weekStart: LocalDate): string {
  const end = addDays(weekStart, 6);
  if (weekStart.slice(0, 7) === end.slice(0, 7)) {
    return `${dayOfMonth(weekStart)}–${dayOfMonth(end)} ${monthShort(end)}`;
  }
  return `${formatDayMonth(weekStart)} – ${formatDayMonth(end)}`;
}

/** "16:45–18:25", "16:45" or "" */
export function formatTimeRange(start: LocalTime | null, end: LocalTime | null): string {
  if (start && end) return `${start}–${end}`;
  return start ?? "";
}
