"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/session";
import type { AdminUserListItem, EmailCampaignListItem } from "@/lib/types";
import { MassEmail } from "@/components/MassEmail";
import { UserManagement } from "@/components/UserManagement";

type Profile = { id:string; name:string; category:string; requirements:string[]; requirementOther:string; technicalCompetencies:string; experience:string; studyType:string; educationLevel:string; shiftSystem:string; genderPreference:string; quantity:number; behaviours:string[] };
type Row = { id:string; name:string; position:string; company:string; email:string; phone:string; sector:string; sector_other?:string; company_size:string; commune:string; commune_other?:string; demand_timing:string; has_gaps:string; gap_details?:string; wants_support:string; contact_consent:string; comments?:string; created_at:string; profiles:Profile[] };
type Tab = "summary" | "responses" | "email" | "users";
type DataPoint = { name: string; value: number; note?: string };

const actualSector = (row: Row) => row.sector === "Otro" ? row.sector_other || "Otro" : row.sector;
const actualCommune = (row: Row) => row.commune === "Otra" ? row.commune_other || "Otra" : row.commune;
const normalizedYes = (value: string) => ["si", "sí"].includes(value.trim().toLocaleLowerCase("es"));
const percentage = (value: number, total: number) => total ? Math.round(value / total * 100) : 0;

function countBy(rows: Row[], key: (row: Row) => string): DataPoint[] {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const name = key(row) || "Sin respuesta";
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function Bars({ data, color = "teal", limit = 10 }: { data: DataPoint[]; color?: string; limit?: number }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return <div className="bars">{data.slice(0, limit).map((item) => <div className="bar-row" key={item.name}>
    <div className="bar-label"><span>{item.name}</span><strong>{item.value}{item.note ? " · " + item.note : ""}</strong></div>
    <div className="bar-track"><span className={"bar-fill " + color} style={{ width: (item.value / max * 100) + "%" }} /></div>
  </div>)}</div>;
}

function ChartCard({ eyebrow, title, data, color }: { eyebrow: string; title: string; data: DataPoint[]; color?: string }) {
  return <article className="chart-card"><div className="card-title"><div><span className="mono">{eyebrow}</span><h2>{title}</h2></div><small>{data.reduce((sum, item) => sum + item.value, 0)} registros</small></div><Bars data={data} color={color} /></article>;
}

export function Dashboard({ initialRows, initialUsers, initialCampaigns, user }: { initialRows: Row[]; initialUsers: AdminUserListItem[]; initialCampaigns: EmailCampaignListItem[]; user: SessionUser }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [userCount, setUserCount] = useState(initialUsers.length);
  const [tab, setTab] = useState<Tab>("summary");
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [commune, setCommune] = useState("");
  const [detail, setDetail] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sectors = useMemo(() => [...new Set(rows.map(actualSector))].filter(Boolean).sort(), [rows]);
  const companySizes = useMemo(() => [...new Set(rows.map((row) => row.company_size))].filter(Boolean).sort(), [rows]);
  const communes = useMemo(() => [...new Set(rows.map(actualCommune))].filter(Boolean).sort(), [rows]);
  const filtered = useMemo(() => rows.filter((row) => (!sector || actualSector(row) === sector) && (!companySize || row.company_size === companySize) && (!commune || actualCommune(row) === commune)), [rows, sector, companySize, commune]);
  const searched = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    if (!query) return filtered;
    return filtered.filter((row) => [row.company, row.email, row.name, row.position, actualSector(row), actualCommune(row), ...row.profiles.map((profile) => profile.name)].join(" ").toLocaleLowerCase("es").includes(query));
  }, [filtered, search]);

  const profileDemand = useMemo(() => {
    const demand = new Map<string, { value: number; companies: Set<string> }>();
    filtered.forEach((row) => row.profiles.forEach((profile) => {
      const current = demand.get(profile.name) || { value: 0, companies: new Set<string>() };
      current.value += Number(profile.quantity || 0);
      current.companies.add(row.company);
      demand.set(profile.name, current);
    }));
    return [...demand.entries()].map(([name, item]) => ({ name, value: item.value, note: item.companies.size + (item.companies.size === 1 ? " empresa" : " empresas") })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const totalPeople = filtered.reduce((sum, row) => sum + row.profiles.reduce((profileSum, profile) => profileSum + Number(profile.quantity || 0), 0), 0);
  const activeDemand = filtered.filter((row) => row.demand_timing !== "No por el momento").length;
  const wantsSupport = filtered.filter((row) => normalizedYes(row.wants_support)).length;
  const contactConsent = filtered.filter((row) => normalizedYes(row.contact_consent)).length;
  const hasGaps = filtered.filter((row) => normalizedYes(row.has_gaps)).length;
  const latest = filtered[0]?.created_at ? new Date(filtered[0].created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" }) : "sin registros";

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
    router.refresh();
  };

  const remove = async () => {
    if (!detail || deleting) return;
    setDeleting(true);
    const response = await fetch("/api/admin/responses/" + detail.id, { method: "DELETE" });
    setDeleting(false);
    if (response.ok) {
      setRows((current) => current.filter((row) => row.id !== detail.id));
      setDetail(null);
    }
  };

  return <div className="dashboard-shell">
    <aside className="dashboard-sidebar">
      <Link href="/" className="dashboard-brand"><Image src="/logo-centinela.png" width={170} height={60} alt="Centinela · Antofagasta Minerals" /><span className="mono">Programa de Empleabilidad</span></Link>
      <nav aria-label="Secciones del panel">
        <button className={tab === "summary" ? "active" : ""} onClick={() => setTab("summary")}><span>◫</span> Resumen <b>{rows.length}</b></button>
        <button className={tab === "responses" ? "active" : ""} onClick={() => setTab("responses")}><span>≡</span> Respuestas</button>
        {user.role === "admin" ? <button className={tab === "email" ? "active" : ""} onClick={() => setTab("email")}><span>✉</span> Envío masivo</button> : null}
        {user.role === "admin" ? <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}><span>♙</span> Usuarios <b>{userCount}</b></button> : null}
      </nav>
      <div className="sidebar-user"><div>{user.name}<small>{user.email}</small></div><button onClick={logout}>Salir</button></div>
    </aside>

    <main className="dashboard-main">
      <header className="dashboard-top">
        <div><p className="mono">Programa de Empleabilidad</p><h1>Centro de control</h1><span>Analiza el diagnóstico de demanda laboral y gestiona las invitaciones.</span></div>
        <div className="dashboard-actions"><Link href="/diagnostico" target="_blank" className="dash-ghost">Ver formulario ↗</Link>{tab === "responses" ? <a className="dash-primary" href="/api/admin/export">Exportar CSV</a> : null}</div>
      </header>

      {tab === "summary" || tab === "responses" ? <section className="dashboard-filters" aria-label="Filtros del panel">
        <label>Rubro<select value={sector} onChange={(event) => setSector(event.target.value)}><option value="">Todos</option>{sectors.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Tamaño<select value={companySize} onChange={(event) => setCompanySize(event.target.value)}><option value="">Todos</option>{companySizes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Comuna<select value={commune} onChange={(event) => setCommune(event.target.value)}><option value="">Todos</option>{communes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <strong>{filtered.length} de {rows.length} respuestas</strong>
      </section> : null}

      {tab === "summary" ? <>
        <section className="demand-grid">
          <article className="demand-card"><div className="card-title"><div><span className="mono">Capital humano</span><h2>Demanda por perfil</h2><p>Personas requeridas por las empresas.</p></div><strong>{totalPeople}</strong></div>{profileDemand.length ? <Bars data={profileDemand} color="terracotta" /> : <p className="card-empty">Aún no hay perfiles registrados.</p>}</article>
          <article className="demand-card"><div className="card-title"><div><span className="mono">Proyección</span><h2>Por plazo</h2><p>Intención según horizonte declarado.</p></div></div>{filtered.length ? <Bars data={countBy(filtered, (row) => row.demand_timing)} color="amber" /> : <p className="card-empty">Aún no hay respuestas.</p>}</article>
        </section>

        <section className="metric-grid metric-grid-five">
          <article><span>Respuestas</span><strong>{filtered.length}</strong><small>Última: {latest}</small></article>
          <article><span>Con demanda activa</span><strong>{activeDemand}</strong><small>{percentage(activeDemand, filtered.length)}% requiere personal</small></article>
          <article><span>Solicita apoyo</span><strong>{percentage(wantsSupport, filtered.length)}%</strong><small>{wantsSupport} empresas interesadas</small></article>
          <article><span>Autoriza contacto</span><strong>{percentage(contactConsent, filtered.length)}%</strong><small>{contactConsent} empresas contactables</small></article>
          <article><span>Declara brechas</span><strong>{percentage(hasGaps, filtered.length)}%</strong><small>{hasGaps} identifican brechas</small></article>
        </section>

        {filtered.length ? <>
          <section className="chart-grid chart-grid-three">
            <ChartCard eyebrow="Actividad económica" title="Rubro" data={countBy(filtered, actualSector)} />
            <ChartCard eyebrow="Dotación" title="Tamaño de empresa" data={countBy(filtered, (row) => row.company_size)} color="terracotta" />
            <ChartCard eyebrow="Territorio" title="Comuna" data={countBy(filtered, actualCommune)} color="amber" />
            <ChartCard eyebrow="Proyección" title="Requiere personal" data={countBy(filtered, (row) => row.demand_timing)} />
            <ChartCard eyebrow="Capital humano" title="Brechas de competencias" data={countBy(filtered, (row) => row.has_gaps)} color="terracotta" />
            <ChartCard eyebrow="Vinculación" title="Apoyo en perfiles" data={countBy(filtered, (row) => row.wants_support)} color="amber" />
          </section>
          <section className="insight-grid">
            <article><div className="card-title"><div><span className="mono">Información cualitativa</span><h2>Perfiles laborales</h2></div></div>{filtered.flatMap((row) => row.profiles.map((profile) => ({ company: row.company, sector: actualSector(row), text: profile.name }))).slice(0, 10).map((item, index) => <div className="insight-row" key={item.company + item.text + index}><strong>{item.company} · {item.sector}</strong><p>{item.text}</p></div>)}</article>
            <article><div className="card-title"><div><span className="mono">Especialidades</span><h2>Competencias técnicas</h2></div></div>{filtered.flatMap((row) => row.profiles.filter((profile) => profile.technicalCompetencies).map((profile) => ({ company: row.company, sector: actualSector(row), text: profile.technicalCompetencies }))).slice(0, 10).map((item, index) => <div className="insight-row" key={item.company + item.text + index}><strong>{item.company} · {item.sector}</strong><p>{item.text}</p></div>)}</article>
            <article><div className="card-title"><div><span className="mono">Necesidades</span><h2>Comentarios</h2></div></div>{filtered.filter((row) => row.comments).slice(0, 10).map((row) => <div className="insight-row" key={row.id}><strong>{row.company} · {actualSector(row)}</strong><p>{row.comments}</p></div>)}</article>
          </section>
        </> : <div className="dashboard-empty"><h2>Aún no hay respuestas registradas</h2><p>Cuando una empresa complete el diagnóstico, sus datos y estadísticas aparecerán aquí automáticamente.</p><Link href="/diagnostico" className="dash-primary">Abrir diagnóstico</Link></div>}
      </> : null}

      {tab === "responses" ? <section className="responses-card">
        <div className="responses-title"><div><span className="mono">Registro completo</span><h2>Respuestas del diagnóstico</h2></div><strong>{searched.length} total</strong></div>
        <div className="response-tools"><input type="search" placeholder="Buscar respuestas" aria-label="Buscar respuestas" value={search} onChange={(event) => setSearch(event.target.value)} /><span>{searched.length} de {filtered.length}</span></div>
        {!searched.length ? <div className="table-empty">Ninguna respuesta coincide con la búsqueda.</div> : <div className="table-wrap"><table><thead><tr><th>Empresa</th><th>Nombre y cargo</th><th>Rubro</th><th>Tamaño</th><th>Comuna</th><th>Demanda</th><th>Perfiles</th><th>Correo</th><th>Fecha</th><th></th></tr></thead><tbody>{searched.map((row) => <tr key={row.id}><td><strong>{row.company}</strong></td><td><strong>{row.name}</strong><small>{row.position}</small></td><td>{actualSector(row)}</td><td>{row.company_size}</td><td>{actualCommune(row)}</td><td><span className={"status " + (row.demand_timing === "No por el momento" ? "neutral" : "positive")}>{row.demand_timing}</span></td><td>{row.profiles.map((profile) => profile.name + " (" + profile.quantity + ")").join(" · ") || "—"}</td><td>{row.email}</td><td>{new Date(row.created_at).toLocaleDateString("es-CL")}</td><td><button onClick={() => setDetail(row)}>Ver ficha</button></td></tr>)}</tbody></table></div>}
      </section> : null}

      {tab === "email" && user.role === "admin" ? <MassEmail initialCampaigns={initialCampaigns} /> : null}
      {tab === "users" && user.role === "admin" ? <UserManagement initialUsers={initialUsers} currentUserId={user.id} onUserCreated={() => setUserCount((count) => count + 1)} /> : null}
    </main>

    {detail ? <div className="detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDetail(null)}><section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="response-detail-title">
      <header><div><span className="mono">Registro completo</span><h2 id="response-detail-title">{detail.company}</h2><p>{new Date(detail.created_at).toLocaleString("es-CL")}</p></div><button aria-label="Cerrar ficha" onClick={() => setDetail(null)}>×</button></header>
      <div className="detail-body">
        <h3>Perfiles requeridos · {detail.profiles.length}</h3>
        {detail.profiles.length ? detail.profiles.map((profile) => <article className="detail-profile" key={profile.id}><div><strong>{profile.name}</strong><span>{profile.category}</span></div><b>{profile.quantity} personas</b><div className="profile-facts"><span>Experiencia<strong>{profile.experience || "—"}</strong></span><span>Estudios<strong>{[profile.studyType, profile.educationLevel].filter(Boolean).join(" · ") || "—"}</strong></span><span>Turnos<strong>{profile.shiftSystem || "—"}</strong></span><span>Preferencia<strong>{profile.genderPreference || "—"}</strong></span></div><p><b>Competencias técnicas:</b> {profile.technicalCompetencies || "—"}</p><small>Requisitos: {[...profile.requirements, profile.requirementOther].filter(Boolean).join(" · ") || "—"}</small><small>Conductas: {profile.behaviours.join(" · ") || "—"}</small></article>) : <p className="no-profile">Sin perfiles informados.</p>}
        <h3>Información de la empresa</h3>
        <div className="detail-grid"><div><small>Contacto</small><strong>{detail.name}</strong><p>{detail.position}<br />{detail.email}<br />{detail.phone}</p></div><div><small>Empresa</small><strong>{actualSector(detail)}</strong><p>{detail.company_size}<br />{actualCommune(detail)}</p></div><div><small>Demanda</small><strong>{detail.demand_timing}</strong><p>Brechas: {detail.has_gaps}<br />Apoyo: {detail.wants_support}<br />Contacto: {detail.contact_consent}</p></div></div>
        {detail.gap_details ? <div className="detail-note"><small>Brechas identificadas</small><p>{detail.gap_details}</p></div> : null}
        {detail.comments ? <div className="detail-note"><small>Comentarios</small><p>{detail.comments}</p></div> : null}
      </div>
      <footer><button className="dash-ghost" onClick={() => setDetail(null)}>Cerrar</button>{user.role === "admin" ? <button className="delete-btn" onClick={remove} disabled={deleting}>{deleting ? "Eliminando…" : "Eliminar respuesta"}</button> : null}</footer>
    </section></div> : null}
  </div>;
}
