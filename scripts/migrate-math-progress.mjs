import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import pg from "pg";
const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd());
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Database connection is not configured");
const client = new pg.Client({ connectionString, connectionTimeoutMillis: 15000 });
try {
  await client.connect();
  await client.query(await readFile(new URL("../supabase/migrations/202610080001_create_math_learning_progress.sql", import.meta.url), "utf8"));
  console.log("Math learning progress migration applied.");
} catch {
  console.error("Math learning progress migration failed. Check the database connection.");
  process.exitCode = 1;
} finally { await client.end(); }
