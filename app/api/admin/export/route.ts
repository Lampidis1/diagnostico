import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getSession } from "@/lib/session";

const q = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""').replaceAll("\n", " ")}"`;

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const sql = getSql();
  const rows = await sql`SELECT r.*, COALESCE(string_agg(p.name || ' (' || p.quantity || ')', '; '), '') AS profiles_summary, COALESCE(sum(p.quantity),0) AS total_people FROM diagnostic_responses r LEFT JOIN demanded_profiles p ON p.response_id=r.id GROUP BY r.id ORDER BY r.created_at DESC`;
  const headers = ["Fecha", "Nombre", "Cargo", "Empresa", "Correo", "Teléfono", "Rubro", "Tamaño", "Comuna", "Demanda", "Perfiles", "Personas", "Brechas", "Detalle brechas", "Solicita apoyo", "Autoriza contacto", "Comentarios"];
  const lines = rows.map(r => [r.created_at,r.name,r.position,r.company,r.email,r.phone,r.sector === "Otro" ? r.sector_other : r.sector,r.company_size,r.commune === "Otra" ? r.commune_other : r.commune,r.demand_timing,r.profiles_summary,r.total_people,r.has_gaps,r.gap_details,r.wants_support,r.contact_consent,r.comments].map(q).join(","));
  const csv = "\uFEFF" + headers.map(q).join(",") + "\n" + lines.join("\n");
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="diagnostico-empleabilidad-${new Date().toISOString().slice(0,10)}.csv"` } });
}
