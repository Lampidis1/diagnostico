import { getSql } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { Dashboard } from "@/components/Dashboard";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel interno · Programa de Empleabilidad" };

export default async function AdminPage() {
  const session = await requireSession();
  const sql = getSql();
  const [rows, users] = await Promise.all([
    sql`SELECT r.*, COALESCE(json_agg(json_build_object('id',p.id,'name',p.name,'category',p.category,'requirements',p.requirements,'requirementOther',p.requirement_other,'technicalCompetencies',p.technical_competencies,'experience',p.experience,'studyType',p.study_type,'educationLevel',p.education_level,'shiftSystem',p.shift_system,'genderPreference',p.gender_preference,'quantity',p.quantity,'behaviours',p.behaviours)) FILTER (WHERE p.id IS NOT NULL), '[]'::json) AS profiles FROM diagnostic_responses r LEFT JOIN demanded_profiles p ON p.response_id = r.id GROUP BY r.id ORDER BY r.created_at DESC`,
    session.role === "admin"
      ? sql`SELECT id,email,name,role,active,created_at FROM admin_users ORDER BY active DESC, name ASC`
      : Promise.resolve([]),
  ]);
  return <Dashboard initialRows={JSON.parse(JSON.stringify(rows))} initialUsers={JSON.parse(JSON.stringify(users))} user={session} />;
}
