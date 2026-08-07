import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import type { DiagnosticPayload } from "@/lib/types";

const clean = (v: unknown, max = 2000) => typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DiagnosticPayload;
    const required = [body.name, body.position, body.company, body.email, body.phone, body.sector, body.companySize, body.commune, body.demandTiming, body.hasGaps, body.wantsSupport, body.contactConsent];
    if (required.some(v => !clean(v, 255)) || !/^\S+@\S+\.\S+$/.test(body.email) || !Array.isArray(body.profiles)) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    if (body.demandTiming !== "No por el momento" && body.profiles.length === 0) return NextResponse.json({ error: "Agregue al menos un perfil" }, { status: 400 });
    const responseId = randomUUID();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const ipHash = ip ? createHash("sha256").update(`${ip}:${process.env.SESSION_SECRET || "local"}`).digest("hex") : null;
    const sql = getSql();
    const queries = [sql`INSERT INTO diagnostic_responses (id,name,position,company,email,phone,sector,sector_other,company_size,commune,commune_other,demand_timing,has_gaps,gap_details,wants_support,contact_consent,comments,source_ip_hash) VALUES (${responseId},${clean(body.name,120)},${clean(body.position,120)},${clean(body.company,160)},${clean(body.email,180).toLowerCase()},${clean(body.phone,40)},${clean(body.sector,100)},${clean(body.sectorOther,120) || null},${clean(body.companySize,100)},${clean(body.commune,100)},${clean(body.communeOther,120) || null},${clean(body.demandTiming,100)},${clean(body.hasGaps,40)},${clean(body.gapDetails) || null},${clean(body.wantsSupport,10)},${clean(body.contactConsent,10)},${clean(body.comments) || null},${ipHash})`];
    for (const p of body.profiles.slice(0, 30)) {
      if (!clean(p.name, 160) || !clean(p.technicalCompetencies) || !clean(p.experience, 80) || !clean(p.studyType, 80) || !clean(p.educationLevel, 80) || !clean(p.shiftSystem, 80)) return NextResponse.json({ error: "Perfil incompleto" }, { status: 400 });
      queries.push(sql`INSERT INTO demanded_profiles (id,response_id,name,category,requirements,requirement_other,technical_competencies,experience,study_type,education_level,shift_system,gender_preference,quantity,behaviours) VALUES (${randomUUID()},${responseId},${clean(p.name,160)},${clean(p.category,120) || null},${JSON.stringify(Array.isArray(p.requirements) ? p.requirements.slice(0,20) : [])}::jsonb,${clean(p.requirementOther,500) || null},${clean(p.technicalCompetencies)},${clean(p.experience,80)},${clean(p.studyType,80)},${clean(p.educationLevel,80)},${clean(p.shiftSystem,80)},${clean(p.genderPreference,80) || null},${Math.max(1, Math.min(9999, Number(p.quantity) || 1))},${JSON.stringify(Array.isArray(p.behaviours) ? p.behaviours.slice(0,20) : [])}::jsonb)`);
    }
    await sql.transaction(queries);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("diagnostic_submit", error);
    return NextResponse.json({ error: "No fue posible guardar la respuesta" }, { status: 500 });
  }
}
