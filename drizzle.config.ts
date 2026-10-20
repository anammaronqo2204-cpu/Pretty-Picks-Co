import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Reads DATABASE_URL from .env so the same command works locally and against
// your production (Supabase) database: DATABASE_URL=... npx drizzle-kit push
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db" },
  strict: false,
  verbose: true,
});
