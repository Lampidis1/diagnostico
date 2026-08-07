import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { createSession, sessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json() as { email?: string; password?: string };
    if (!email || !password) return NextResponse.json({ error: "Credenciales incompletas" }, { status: 400 });
    const sql = getSql();
    const rows = await sql`SELECT id,email,name,role,password_hash FROM admin_users WHERE email = ${email.trim().toLowerCase()} LIMIT 1`;
    const user = rows[0];
    if (!user || !await bcrypt.compare(password, String(user.password_hash))) return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
    const token = await createSession({ id: String(user.id), email: String(user.email), name: String(user.name), role: user.role === "viewer" ? "viewer" : "admin" });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookie.name, token, sessionCookie.options);
    return response;
  } catch (error) {
    console.error("login", error);
    return NextResponse.json({ error: "No fue posible iniciar sesión" }, { status: 500 });
  }
}
