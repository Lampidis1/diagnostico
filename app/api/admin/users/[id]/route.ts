import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateTemporaryPassword, hashPassword } from "@/lib/admin-users";

const uuidPattern = /^[0-9a-f-]{36}$/i;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  if (!uuidPattern.test(id)) return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });

  try {
    const body = await request.json() as { action?: string; name?: string; role?: string; active?: boolean };
    const sql = getSql();
    const targets = await sql`SELECT id,email,name,role,active,created_at FROM admin_users WHERE id = ${id} LIMIT 1`;
    const target = targets[0];
    if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    if (body.action === "reset-password") {
      const temporaryPassword = generateTemporaryPassword();
      const passwordHash = await hashPassword(temporaryPassword);
      await sql`UPDATE admin_users SET password_hash = ${passwordHash} WHERE id = ${id}`;
      return NextResponse.json({ user: target, temporaryPassword });
    }

    const name = body.name?.trim().slice(0, 120) || String(target.name);
    const role = body.role === "viewer" ? "viewer" : body.role === "admin" ? "admin" : String(target.role);
    const active = typeof body.active === "boolean" ? body.active : Boolean(target.active);

    if (id === session.id && (!active || role !== "admin")) return NextResponse.json({ error: "No puedes desactivar ni degradar tu propia cuenta" }, { status: 400 });
    if (target.role === "admin" && target.active && (!active || role !== "admin")) {
      const counts = await sql`SELECT COUNT(*)::int AS total FROM admin_users WHERE role = 'admin' AND active = TRUE`;
      if (Number(counts[0]?.total) <= 1) return NextResponse.json({ error: "Debe permanecer al menos un administrador activo" }, { status: 400 });
    }

    const rows = await sql`UPDATE admin_users SET name = ${name}, role = ${role}, active = ${active} WHERE id = ${id} RETURNING id,email,name,role,active,created_at`;
    return NextResponse.json({ user: rows[0] });
  } catch (error) {
    console.error("admin_user_update", error);
    return NextResponse.json({ error: "No fue posible actualizar el usuario" }, { status: 500 });
  }
}
