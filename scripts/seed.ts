import { readFileSync } from "node:fs";
import path from "node:path";
import { closeDb, getDb } from "@/lib/db";
import { loadPlanSeed } from "@/lib/seed/load";
import { parsePlanSeed } from "@/lib/seed/planSchema";

async function main() {
  const raw = JSON.parse(readFileSync(path.join(process.cwd(), "seed/plan.json"), "utf8"));
  const plan = parsePlanSeed(raw);
  const summary = await loadPlanSeed(getDb(), plan, { ownerEmail: process.env.OWNER_EMAIL });
  console.log("Seed loaded:", summary);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
