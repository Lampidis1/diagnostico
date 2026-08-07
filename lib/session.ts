import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";

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
    return { id: String(payload.id), email: String(payload.email), name: String(payload.name), role: payload.role === "viewer" ? "viewer" : "admin" };
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
