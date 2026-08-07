"use client";

import { useMemo, useState } from "react";
import type { EmailCampaignListItem } from "@/lib/types";

type Recipient = { name: string; email: string; cc: string[] };
type TemplateKey = "invitation" | "reminder" | "custom";

const templates: Record<TemplateKey, { subject: string; message: string }> = {
  invitation: {
    subject: "{{nombre}}, cuéntenos qué perfiles laborales necesita su empresa",
    message: "Hola {{nombre}},\n\nA través de esta encuesta queremos conocer los perfiles que actualmente demanda su empresa y los requisitos necesarios para su contratación.\n\nEsta información nos permitirá diseñar programas de capacitación ajustados a sus necesidades y ofrecer apoyo en la difusión y búsqueda de perfiles laborales cuando lo requiera.",
  },
  reminder: {
    subject: "Recordatorio: diagnóstico de demanda laboral local",
    message: "Hola {{nombre}},\n\nLe recordamos completar el Diagnóstico de Empleabilidad y Demanda Laboral Local. Su respuesta nos permitirá diseñar iniciativas ajustadas a las necesidades de las empresas de la región.\n\nCompletarlo toma aproximadamente 5 minutos.",
  },
  custom: { subject: "", message: "" },
};

function parseRecipients(value: string) {
  const recipients: Recipient[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line.split(/[,;]/).map((part) => part.trim()).filter(Boolean);
    const emails = parts.filter((part) => emailPattern.test(part.toLowerCase())).map((part) => part.toLowerCase());
    if (!emails.length) { invalid.push(line); continue; }
    const email = emails[0];
    if (seen.has(email)) continue;
    seen.add(email);
    recipients.push({ name: parts.find((part) => !emailPattern.test(part.toLowerCase())) || "", email, cc: emails.slice(1) });
  }
  return { recipients, invalid };
}

function previewHtml(message: string) {
  const safe = message.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("{{nombre}}", "Empresa invitada").replaceAll("{{correo}}", "contacto@empresa.cl").replaceAll("\n", "<br>");
  return '<!doctype html><html><body style="margin:0;background:#eef3f4;font-family:Arial,sans-serif"><div style="max-width:560px;margin:20px auto;background:#fff;border-radius:14px;overflow:hidden"><div style="height:7px;background:#d46645"></div><div style="padding:28px"><div style="color:#287c98;font-size:10px;letter-spacing:2px">PROGRAMA DE EMPLEABILIDAD</div><h1 style="color:#104b5e;font-size:25px">Diagnóstico de Empleabilidad<br>y Demanda Laboral Local</h1><p style="color:#52636a;line-height:1.65">' + safe + '</p><span style="display:inline-block;background:#287c98;color:white;padding:13px 18px;border-radius:8px;font-weight:bold;font-size:12px">RESPONDER EL DIAGNÓSTICO →</span></div><div style="background:#104b5e;color:#d7e6e9;padding:17px 28px;font-size:11px">Programa de Empleabilidad · Minera Centinela</div></div></body></html>';
}

export function MassEmail({ initialCampaigns }: { initialCampaigns: EmailCampaignListItem[] }) {
  const [rawRecipients, setRawRecipients] = useState("");
  const [template, setTemplate] = useState<TemplateKey>("invitation");
  const [subject, setSubject] = useState(templates.invitation.subject);
  const [message, setMessage] = useState(templates.invitation.message);
  const [testEmail, setTestEmail] = useState("");
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [sending, setSending] = useState<"test" | "mass" | "">("");
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const parsed = useMemo(() => parseRecipients(rawRecipients), [rawRecipients]);
  const preview = useMemo(() => previewHtml(message), [message]);

  function chooseTemplate(value: TemplateKey) {
    setTemplate(value);
    setSubject(templates[value].subject);
    setMessage(templates[value].message);
  }

  async function send(kind: "test" | "mass") {
    const recipients = kind === "test" ? parseRecipients(testEmail).recipients : parsed.recipients;
    if (!recipients.length) return setNotice({ kind: "error", text: kind === "test" ? "Ingresa un correo de prueba válido" : "Agrega al menos un destinatario válido" });
    if (kind === "mass" && !window.confirm("Se enviará el correo a " + recipients.length + " destinatario(s). ¿Continuar?")) return;
    setSending(kind);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipients, subject, message, template: kind === "test" ? "test" : template }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No fue posible enviar el correo");
      if (data.campaign) setCampaigns((current) => [data.campaign, ...current].slice(0, 10));
      setNotice({ kind: "ok", text: kind === "test" ? "Correo de prueba enviado" : "Envío completado para " + data.sent + " destinatario(s)" });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "No fue posible enviar el correo" });
    } finally {
      setSending("");
    }
  }

  return <section className="mail-layout">
    <article className="mail-card">
      <div className="mail-heading"><span className="mono">Invitaciones</span><h2>Envío masivo del diagnóstico</h2><p>Invita a empresas con un mensaje personalizado y elimina duplicados automáticamente.</p></div>
      {notice ? <p className={"mail-notice " + notice.kind} role="status">{notice.text}</p> : null}
      <label className="mail-field">Destinatarios (uno por línea)<textarea rows={7} value={rawRecipients} onChange={(event) => setRawRecipients(event.target.value)} placeholder={"Constructora Andes, contacto@andes.cl\nrrhh@transportesnorte.cl\nMinera Sur, gerencia@sur.cl, rrhh@sur.cl"} /></label>
      <p className="mail-help">Formatos: correo · Nombre, correo · Nombre, correo principal, CC. {parsed.recipients.length} válidos{parsed.invalid.length ? " · " + parsed.invalid.length + " líneas no reconocidas" : ""}.</p>
      <div className="mail-grid"><label className="mail-field">Plantilla<select value={template} onChange={(event) => chooseTemplate(event.target.value as TemplateKey)}><option value="invitation">Invitación al diagnóstico</option><option value="reminder">Recordatorio</option><option value="custom">En blanco</option></select></label><label className="mail-field">Asunto<input value={subject} maxLength={180} onChange={(event) => setSubject(event.target.value)} /></label></div>
      <p className="mail-help">Campos dinámicos: <button type="button" onClick={() => setSubject((value) => value + " {{nombre}}")}>{"{{nombre}}"}</button> <button type="button" onClick={() => setSubject((value) => value + " {{correo}}")}>{"{{correo}}"}</button></p>
      <label className="mail-field">Mensaje<textarea rows={9} value={message} maxLength={10000} onChange={(event) => setMessage(event.target.value)} /></label>
      <div className="mail-test"><label className="mail-field">Enviar prueba a un correo<input type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="tu.correo@empresa.cl" /></label><button className="dash-ghost" disabled={Boolean(sending)} onClick={() => send("test")}>{sending === "test" ? "Enviando…" : "Enviar prueba"}</button></div>
      <button className="dash-primary mail-send" disabled={Boolean(sending) || !parsed.recipients.length || !subject.trim() || !message.trim()} onClick={() => send("mass")}>{sending === "mass" ? "Enviando…" : "Enviar a " + parsed.recipients.length + " destinatario(s)"}</button>
    </article>
    <aside className="mail-preview-card"><div><span className="mono">Vista previa</span><h2>Correo combinado</h2></div><iframe title="Vista previa del correo" sandbox="" srcDoc={preview} />{campaigns.length ? <div className="campaign-history"><h3>Últimos envíos</h3>{campaigns.map((campaign) => <div key={campaign.id}><span className={"user-status " + (campaign.status === "sent" ? "active" : "inactive")}>{campaign.status === "sent" ? "Enviado" : "Fallido"}</span><strong>{campaign.subject}</strong><small>{campaign.recipient_count} destinatario(s) · {new Date(campaign.created_at).toLocaleString("es-CL")}</small></div>)}</div> : null}</aside>
  </section>;
}
