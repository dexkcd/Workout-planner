import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

declare global {
  var __formkollDb: { client: ReturnType<typeof postgres>; db: Db } | undefined;
}

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

/**
 * Lazily created singleton so importing this module (for example during
 * `next build`) never opens a connection.
 */
export function getDb(): Db {
  if (!globalThis.__formkollDb) {
    const client = postgres(databaseUrl(), { max: 10, prepare: false });
    globalThis.__formkollDb = { client, db: drizzle(client, { schema, casing: "snake_case" }) };
  }
  return globalThis.__formkollDb.db;
}

export async function closeDb(): Promise<void> {
  if (globalThis.__formkollDb) {
    await globalThis.__formkollDb.client.end();
    globalThis.__formkollDb = undefined;
  }
}

export { schema };
