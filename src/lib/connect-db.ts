import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

const connectionString = process.env.DATABASE_URL!;

// Reuse the pool across Next.js module reloads and server bundles in this process.
// Otherwise each instance can hold its own connections to the Supabase pooler.
const globalForDatabase = globalThis as typeof globalThis & {
  kaizenPostgresClient?: ReturnType<typeof postgres>;
};

const client = globalForDatabase.kaizenPostgresClient ?? postgres(connectionString, {
  // Supabase's transaction pooler does not support prepared statements.
  prepare: false,
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

globalForDatabase.kaizenPostgresClient = client;
export const db = drizzle(client, { schema });

export type DbType = typeof db;
