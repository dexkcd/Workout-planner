import { setDayTypeAction } from "@/lib/actions/schedule";
import { DAY_TYPE_LABEL, type DayType, type LocalDate } from "@/lib/rules";

interface Props {
  date: LocalDate;
  computed: DayType;
  override: DayType | null;
}

/** Lets the user override the computed day type (not on diet-break days). */
export function DayTypeMenu({ date, computed, override }: Props) {
  if (computed === "break") return null;
  return (
    <form action={setDayTypeAction} className="flex items-center justify-between gap-3 rounded-[16px] bg-surface px-4 py-2.5">
      <input type="hidden" name="date" value={date} />
      <label htmlFor="dayType" className="text-[13px] text-dim">
        Day type{override ? " (set by you)" : ""}
      </label>
      <div className="flex items-center gap-2">
        <select
          id="dayType"
          name="dayType"
          defaultValue={override ?? "auto"}
          className="h-11 rounded-[12px] border border-border bg-surface-2 px-3 text-[14px] text-foreground"
        >
          <option value="auto">Automatic ({DAY_TYPE_LABEL[computed].toLowerCase()})</option>
          <option value="training">Training day</option>
          <option value="rest">Rest day</option>
        </select>
        <button type="submit" className="h-11 rounded-[12px] border border-border px-3.5 text-[14px] font-medium">
          Set
        </button>
      </div>
    </form>
  );
}
