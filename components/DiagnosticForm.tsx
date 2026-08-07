"use client";

import { FormEvent, useMemo, useState } from "react";
import { behaviours, communes, companySizes, demandTimings, miningProfiles, profileRequirements, sectors } from "@/lib/options";
import type { DiagnosticPayload, ProfileDemand } from "@/lib/types";

const blankForm: DiagnosticPayload = {
  name: "", position: "", company: "", email: "", phone: "", sector: "", sectorOther: "",
  companySize: "", commune: "", communeOther: "", demandTiming: "", profiles: [], hasGaps: "",
  gapDetails: "", wantsSupport: "", contactConsent: "", comments: ""
};

function newId() {
  try { if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID(); } catch { /* fallback para contextos no seguros */ }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const blankProfile = (name = "", category = ""): ProfileDemand => ({
  id: newId(), name, category, requirements: [], requirementOther: "", technicalCompetencies: "",
  experience: "", studyType: "", educationLevel: "", shiftSystem: "", genderPreference: "Indistinto", quantity: 1, behaviours: []
});

function RadioGroup({ legend, name, options, value, onChange }: { legend: string; name: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="radio-fieldset">
      <legend>{legend}</legend>
      <div className="radio-grid">
        {options.map((option) => <label className={`choice ${value === option ? "choice--selected" : ""}`} key={option}><input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} /><span>{option}</span></label>)}
      </div>
    </fieldset>
  );
}

function Section({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="form-section"><div className="section-heading"><span className="section-number mono">{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div><div className="section-body">{children}</div></section>;
}

function ProfileModal({ initial, onClose, onSave }: { initial: ProfileDemand; onClose: () => void; onSave: (p: ProfileDemand) => void }) {
  const [profile, setProfile] = useState(initial);
  const set = <K extends keyof ProfileDemand>(key: K, value: ProfileDemand[K]) => setProfile((p) => ({ ...p, [key]: value }));
  const toggle = (key: "requirements" | "behaviours", value: string) => set(key, profile[key].includes(value) ? profile[key].filter((x) => x !== value) : [...profile[key], value]);
  const valid = profile.name.trim() && profile.technicalCompetencies.trim() && profile.experience && profile.studyType && profile.educationLevel && profile.shiftSystem;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div className="brand-rule" />
        <header><div><span className="mono">Ficha de perfil</span><h3 id="profile-title">Completa la demanda del perfil</h3></div><button type="button" className="close-btn" onClick={onClose} aria-label="Cerrar ficha">×</button></header>
        <div className="modal-content">
          <input aria-label="Nombre del perfil" placeholder="Escribe el nombre del perfil" value={profile.name} onChange={(e) => set("name", e.target.value)} />
          <h4>Requisitos mínimos</h4>
          <div className="check-grid">{profileRequirements.map((r) => <label key={r}><input type="checkbox" checked={profile.requirements.includes(r)} onChange={() => toggle("requirements", r)} />{r}</label>)}</div>
          <input aria-label="Otro requisito" placeholder="Otro requisito o certificación específica (opcional)" value={profile.requirementOther} onChange={(e) => set("requirementOther", e.target.value)} />
          <h4>Competencias técnicas del perfil</h4>
          <textarea aria-label="Competencias técnicas del perfil" placeholder="Ej.: operación de equipos, mantenimiento, lectura de planos, software…" rows={3} value={profile.technicalCompetencies} onChange={(e) => set("technicalCompetencies", e.target.value)} />
          <div className="profile-select-grid">
            <label>Años de experiencia<select value={profile.experience} onChange={(e) => set("experience", e.target.value)}><option value="">Seleccionar…</option>{["No requiere experiencia", "Menos de 1 año", "1 a 3 años", "3 a 5 años", "Más de 5 años"].map(v => <option key={v}>{v}</option>)}</select></label>
            <label>Tipo de estudio<select value={profile.studyType} onChange={(e) => set("studyType", e.target.value)}><option value="">Seleccionar…</option>{["No aplica", "Técnico", "Profesional", "Oficio / capacitación", "Otro"].map(v => <option key={v}>{v}</option>)}</select></label>
            <label>Nivel de educación<select value={profile.educationLevel} onChange={(e) => set("educationLevel", e.target.value)}><option value="">Seleccionar…</option>{["Básica completa", "Media completa", "Técnico nivel medio", "Técnico nivel superior", "Profesional", "Postgrado"].map(v => <option key={v}>{v}</option>)}</select></label>
            <label>Sistema de turnos<select value={profile.shiftSystem} onChange={(e) => set("shiftSystem", e.target.value)}><option value="">Seleccionar…</option>{["Diurno / lunes a viernes", "Turno 7x7", "Turno 4x3", "Turno 14x14", "Otro sistema"].map(v => <option key={v}>{v}</option>)}</select></label>
            <label>Preferencia de género (opcional)<select value={profile.genderPreference} onChange={(e) => set("genderPreference", e.target.value)}>{["Indistinto", "Mujer", "Hombre", "Prefiero no especificar"].map(v => <option key={v}>{v}</option>)}</select></label>
            <label>Cantidad de personas<div className="quantity"><button type="button" aria-label="Disminuir cantidad" onClick={() => set("quantity", Math.max(1, profile.quantity - 1))}>−</button><input aria-label="Cantidad de personas requeridas" type="number" min="1" value={profile.quantity} onChange={(e) => set("quantity", Math.max(1, Number(e.target.value)))} /><button type="button" aria-label="Aumentar cantidad" onClick={() => set("quantity", profile.quantity + 1)}>+</button></div></label>
          </div>
          <h4>Competencias conductuales del perfil</h4>
          <div className="check-grid">{behaviours.map((b) => <label key={b}><input type="checkbox" checked={profile.behaviours.includes(b)} onChange={() => toggle("behaviours", b)} />{b}</label>)}</div>
        </div>
        <footer><button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button><button type="button" className="small-primary" disabled={!valid} onClick={() => valid && onSave(profile)}>Guardar perfil</button></footer>
      </div>
    </div>
  );
}

export function DiagnosticForm() {
  const [form, setForm] = useState(blankForm);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [modal, setModal] = useState<ProfileDemand | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const set = <K extends keyof DiagnosticPayload>(key: K, value: DiagnosticPayload[K]) => setForm((f) => ({ ...f, [key]: value }));
  const progressFields = [form.name, form.position, form.company, form.email, form.phone, form.sector, form.companySize, form.commune, form.demandTiming, form.profiles.length ? "yes" : form.demandTiming === "No por el momento" ? "n/a" : "", form.hasGaps, form.hasGaps ? (form.hasGaps !== "Sí" ? "n/a" : form.gapDetails) : "", form.wantsSupport, form.contactConsent, form.comments];
  const answered = progressFields.filter(Boolean).length;
  const percent = Math.round(answered / 15 * 100);
  const requiredValid = form.name && form.position && form.company && /^\S+@\S+\.\S+$/.test(form.email) && form.phone && form.sector && form.companySize && form.commune && form.demandTiming && form.hasGaps && form.wantsSupport && form.contactConsent && (form.demandTiming === "No por el momento" || form.profiles.length > 0) && (form.hasGaps !== "Sí" || form.gapDetails.trim());
  const chosen = useMemo(() => miningProfiles.find(([name]) => name === selectedProfile), [selectedProfile]);

  function saveProfile(profile: ProfileDemand) { set("profiles", [...form.profiles.filter((p) => p.id !== profile.id), profile]); setModal(null); setSelectedProfile(""); }
  async function submit(e: FormEvent) {
    e.preventDefault(); if (!requiredValid || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/diagnostico", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setState("success"); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { setState("error"); }
  }

  if (state === "success") return <section className="success-card"><div className="success-mark">✓</div><p className="mono">Respuesta recibida</p><h2>Gracias por participar</h2><p>La información fue almacenada correctamente y ya forma parte de las estadísticas del programa.</p><button className="small-primary" onClick={() => { setForm(blankForm); setState("idle"); }}>Enviar otra respuesta</button></section>;

  return (
    <form className="diagnostic-form" onSubmit={submit}>
      <div className="progress-meta"><span className="mono">{answered} de 15 respondidas</span><strong>{percent}%</strong></div>
      <div className="progress" role="progressbar" aria-label="Avance del cuestionario" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percent}%` }} /></div>
      <Section number="01" title="Su empresa" subtitle="Identificación y territorio donde opera.">
        <div className="field-grid two"><label>Nombre*<input required value={form.name} onChange={e => set("name", e.target.value)} /></label><label>Cargo*<input required value={form.position} onChange={e => set("position", e.target.value)} /></label><label>Empresa*<input required value={form.company} onChange={e => set("company", e.target.value)} /></label><label>Correo electrónico*<input required type="email" placeholder="nombre@empresa.cl" value={form.email} onChange={e => set("email", e.target.value)} /></label><label>Teléfono*<small>Ejemplo: +56 9 1234 5678</small><input required type="tel" placeholder="+56 9 1234 5678" value={form.phone} onChange={e => set("phone", e.target.value)} /></label></div>
        <RadioGroup legend="Rubro o actividad económica principal de la empresa" name="sector" options={sectors} value={form.sector} onChange={v => set("sector", v)} />
        {form.sector === "Otro" && <label>Otro rubro*<input required value={form.sectorOther} onChange={e => set("sectorOther", e.target.value)} /></label>}
        <RadioGroup legend="Tamaño de la empresa" name="size" options={companySizes} value={form.companySize} onChange={v => set("companySize", v)} />
        <div className="field-grid two"><label>Comuna donde opera principalmente<select value={form.commune} onChange={e => set("commune", e.target.value)}><option value="">Selecciona una comuna…</option>{communes.map(c => <option key={c}>{c}</option>)}</select></label>{form.commune === "Otra" && <label>Otra comuna*<input required value={form.communeOther} onChange={e => set("communeOther", e.target.value)} /></label>}</div>
      </Section>
      <Section number="02" title="Demanda de personal" subtitle="Necesidades de contratación actuales y proyectadas.">
        <RadioGroup legend="¿Actualmente su empresa requiere o proyecta requerir personal?" name="demand" options={demandTimings} value={form.demandTiming} onChange={v => set("demandTiming", v)} />
        {form.demandTiming !== "No por el momento" && <div className="profiles-area"><div className="profiles-heading"><div><h3>Perfiles requeridos</h3><p>Agrega un perfil y completa sus competencias, requisitos y cantidad en una ficha independiente.</p></div><span>{form.profiles.length} perfiles agregados</span></div><div className="profile-picker"><select aria-label="Selecciona un perfil minero" value={selectedProfile} onChange={e => setSelectedProfile(e.target.value)}><option value="">Seleccionar desde el pool minero…</option>{miningProfiles.map(([name, cat]) => <option key={name} value={name}>{name} · {cat}</option>)}</select><button type="button" className="small-primary" disabled={!chosen} onClick={() => chosen && setModal(blankProfile(chosen[0], chosen[1]))}>Agregar perfil</button><button type="button" className="secondary-btn" onClick={() => setModal(blankProfile())}>Otro perfil</button></div>{form.profiles.length === 0 ? <div className="empty-profiles">Todavía no agregas perfiles. Selecciona uno del pool o crea otro perfil.</div> : <div className="profile-cards">{form.profiles.map(p => <article key={p.id}><div><span className="mono">{p.category || "Otro perfil"}</span><h4>{p.name}</h4><p>{p.quantity} {p.quantity === 1 ? "persona" : "personas"} · {p.shiftSystem}</p></div><div className="profile-actions"><button type="button" onClick={() => setModal(p)}>Editar</button><button type="button" onClick={() => set("profiles", form.profiles.filter(x => x.id !== p.id))}>Quitar</button></div></article>)}</div>}</div>}
      </Section>
      <Section number="03" title="Brechas de competencias" subtitle="Brechas generales que la empresa identifica en sus trabajadores o postulantes.">
        <RadioGroup legend="¿Su empresa identifica brechas de competencias en sus trabajadores o postulantes?" name="gaps" options={["Sí", "No", "No lo tiene identificado"]} value={form.hasGaps} onChange={v => set("hasGaps", v)} />
        {form.hasGaps === "Sí" && <label>Describa las principales brechas identificadas*<textarea required rows={4} value={form.gapDetails} onChange={e => set("gapDetails", e.target.value)} /></label>}
      </Section>
      <Section number="04" title="Vinculación laboral" subtitle="Apoyo en búsqueda de perfiles y autorización de contacto.">
        <RadioGroup legend="¿Le interesaría recibir apoyo en la búsqueda y oferta de perfiles laborales cuando su empresa lo requiera?" name="support" options={["Sí", "No"]} value={form.wantsSupport} onChange={v => set("wantsSupport", v)} />
        <RadioGroup legend="¿Autoriza ser contactado(a) para coordinar capacitaciones o procesos de vinculación laboral?" name="consent" options={["Sí", "No"]} value={form.contactConsent} onChange={v => set("contactConsent", v)} />
      </Section>
      <Section number="05" title="Para cerrar" subtitle="Datos de contacto y comentarios abiertos.">
        <label>Comentarios o necesidades específicas que desee compartir<textarea rows={5} value={form.comments} onChange={e => set("comments", e.target.value)} /></label>
        {state === "error" && <p className="form-error">No pudimos guardar la respuesta. Revise la conexión e intente nuevamente.</p>}
        <button className="submit-btn" type="submit" disabled={!requiredValid || state === "sending"}>{state === "sending" ? "ENVIANDO…" : "ENVIAR RESPUESTAS"}</button>
        <p className="privacy">Sus datos se utilizarán únicamente para el diseño de programas de capacitación y vinculación laboral del programa de empleabilidad.</p>
      </Section>
      {modal && <ProfileModal initial={modal} onClose={() => setModal(null)} onSave={saveProfile} />}
    </form>
  );
}
