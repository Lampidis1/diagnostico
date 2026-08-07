import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || "Administrador";
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
if (!email || !password || password.length < 10) throw new Error("Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 10 caracteres)");
const sql = neon(process.env.DATABASE_URL);
const hash = await bcrypt.hash(password, 12);
await sql`INSERT INTO admin_users (email, password_hash, name) VALUES (${email}, ${hash}, ${name}) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name`;
console.log(`Administrador creado: ${email}`);
