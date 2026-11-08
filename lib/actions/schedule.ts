"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guard";
import {
  moveSession,
  setDayTypeOverride,
  setSessionStatus,
  setWeekTemplate,
  undoMove,
} from "@/lib/db/queries/schedule";
import { isLocalDate, templateKeyFor, type DayType } from "@/lib/rules";

const uuid = z.string().uuid();
const localDate = z.string().refine(isLocalDate, "YYYY-MM-DD expected");

function revalidateSchedule() {
  revalidatePath("/today");
  revalidatePath("/week");
}

export async function markSessionAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = uuid.parse(formData.get("id"));
  const status = z.enum(["planned", "done", "skipped"]).parse(formData.get("status"));
  await setSessionStatus(id, status);
  revalidateSchedule();
}

export async function moveSessionAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = uuid.parse(formData.get("id"));
  const toDate = localDate.parse(formData.get("toDate"));
  await moveSession(id, toDate);
  revalidateSchedule();
}

export async function undoMoveAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = uuid.parse(formData.get("id"));
  await undoMove(id);
  revalidateSchedule();
}

export interface ToggleResult {
  tuesdayFrisbee: boolean;
  message: string | null;
}

export async function setTuesdayFrisbeeAction(weekStart: string, on: boolean): Promise<ToggleResult> {
  await requireUser();
  const ws = localDate.parse(weekStart);
  const { keptDone } = await setWeekTemplate(ws, templateKeyFor(on));
  revalidateSchedule();
  const message =
    keptDone.length > 0
      ? `${keptDone.length === 1 ? "A session you already logged stays" : `${keptDone.length} logged sessions stay`} in the week.`
      : null;
  return { tuesdayFrisbee: on, message };
}

export async function setDayTypeAction(formData: FormData): Promise<void> {
  await requireUser();
  const date = localDate.parse(formData.get("date"));
  const value = z.enum(["auto", "training", "rest"]).parse(formData.get("dayType"));
  await setDayTypeOverride(date, value === "auto" ? null : (value as DayType));
  revalidateSchedule();
}
