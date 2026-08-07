import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateTemporaryPassword, hashPassword } from "@/lib/admin-users";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const body = await request.json() as { name?: string; email?: string; role?: string };
    const name = body.name?.trim().slice(0, 120) || "";
    const email = body.email?.trim().toLowerCase().slice(0, 180) || "";
    const role = body.role === "viewer" ? "viewer" : body.role === "admin" ? "admin" : null;
    if (!name || !emailPattern.test(email) || !role) return NextResponse.json({ error: "Nombre, correo y rol son obligatorios" }, { status: 400 });

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    const sql = getSql();
    const rows = await sql`INSERT INTO admin_users (email,password_hash,name,role,active) VALUES (${email},${passwordHash},${name},${role},TRUE) RETURNING id,email,name,role,active,created_at`;
    return NextResponse.json({ user: rows[0], temporaryPassword }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ error: "Ya existe un usuario con ese correo" }, { status: 409 });
    console.error("admin_user_create", error);
    return NextResponse.json({ error: "No fue posible crear el usuario" }, { status: 500 });
  }
}
