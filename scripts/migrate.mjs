import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
const here = dirname(fileURLToPath(import.meta.url));
const migration = await readFile(join(here, "../db/migrations/001_initial.sql"), "utf8");
const sql = neon(process.env.DATABASE_URL);
await sql.query(migration, [], { fullResults: true, arrayMode: false });
console.log("Migración aplicada correctamente.");
