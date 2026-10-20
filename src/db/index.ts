import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

/**
 * Managed Postgres hosts (Supabase, Neon, Railway…) require TLS. Enable it when the
 * connection string asks for it, or force it with DATABASE_SSL=1 / off with DATABASE_SSL=0.
 */
function sslConfig(url: string): PoolConfig["ssl"] {
  const flag = String(process.env.DATABASE_SSL ?? "") as string;
  const wantsSsl = flag !== "0" && (flag === "1" || /sslmode=(require|verify-ca|verify-full)/i.test(url));
  if (!wantsSsl) return undefined;
  // Managed/self-signed certs: skip CA verification unless DATABASE_SSL_STRICT=1
  return String(process.env.DATABASE_SSL_STRICT ?? "") === "1" ? true : { rejectUnauthorized: false };
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: String(databaseUrl),
    ssl: sslConfig(String(databaseUrl)),
    max: Number(process.env.DATABASE_POOL_MAX || 10),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
