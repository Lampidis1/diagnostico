import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { getSql } from "@/lib/db";

export type SessionUser = { id: string; email: string; name: string; role: "admin" | "viewer" };
const COOKIE = "empleabilidad_session";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET debe tener al menos 32 caracteres");
  return new TextEncoder().encode(value);
}

export async function createSession(user: SessionUser) {
  return new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(secret());
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const sql = getSql();
    const rows = await sql`SELECT id,email,name,role FROM admin_users WHERE id = ${String(payload.id)} AND active = TRUE LIMIT 1`;
    const user = rows[0];
    if (!user) return null;
    return { id: String(user.id), email: String(user.email), name: String(user.name), role: user.role === "viewer" ? "viewer" : "admin" };
  } catch { return null; }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/auth");
  return session;
}

export const sessionCookie = {
  name: COOKIE,
  options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 }
};
