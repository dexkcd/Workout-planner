import { readFileSync } from "node:fs";
import path from "node:path";
import type { BrowserContext } from "@playwright/test";
import { SignJWT } from "jose";
import postgres from "postgres";

/** Minimal .env reader so the tests see the same secrets as the server. */
export function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  try {
    const text = readFileSync(path.join(process.cwd(), ".env"), "utf8");
    for (const line of text.split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // no .env file; rely on process.env
  }
  return env;
}

export function sqlClient() {
  const env = loadEnv();
  return postgres(env.DATABASE_URL, { max: 1 });
}

export async function ownerUserId(): Promise<string> {
  const sql = sqlClient();
  try {
    const rows = await sql<{ id: string }[]>`select id from users order by created_at limit 1`;
    if (!rows[0]) throw new Error("No user row; run `npm run db:seed` with OWNER_EMAIL set");
    return rows[0].id;
  } finally {
    await sql.end();
  }
}

/** Signs in by setting the same cookie the passkey flow would set. */
export async function signIn(context: BrowserContext, baseURL: string): Promise<void> {
  const env = loadEnv();
  const userId = await ownerUserId();
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(env.AUTH_SECRET));
  const url = new URL(baseURL);
  await context.addCookies([
    { name: "fk_session", value: token, domain: url.hostname, path: "/", httpOnly: true, sameSite: "Lax" },
  ]);
}
