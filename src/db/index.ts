import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(database?: D1Database) {
  const db = database ?? getCloudflareContext().env.DB;
  return drizzle(db, { schema });
}

export function createDb(database: D1Database) {
  return drizzle(database, { schema });
}

export type Database = ReturnType<typeof getDb>;
