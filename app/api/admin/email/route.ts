import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getSession } from "@/lib/session";

type Recipient = { name?: string; email?: string; cc?: string[] };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const personalize = (value: string, recipient: { name: string; email: string }) => value.replaceAll("{{nombre}}", recipient.name || "estimado(a)").replaceAll("{{correo}}", recipient.email);

function emailHtml(message: string, recipient: { name: string; email: string }, siteUrl: string) {
  const paragraphs = personalize(message, recipient).split(/\n{2,}/).map((paragraph) => `<p style="margin:0 0 16px;line-height:1.65;color:#41555d">${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`).join("");
  const safeUrl = escapeHtml(siteUrl);
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f2f6f6;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:28px 12px"><table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden"><tr><td style="height:7px;background:#d46645"></td></tr><tr><td style="padding:30px 34px 12px"><img src="${safeUrl}/logo-centinela.png" width="165" alt="Centinela · Antofagasta Minerals" style="display:block;max-width:165px;height:auto"><p style="margin:24px 0 8px;color:#287c98;font-size:11px;letter-spacing:2px">PROGRAMA DE EMPLEABILIDAD</p><h1 style="margin:0 0 24px;color:#104b5e;font-size:27px;line-height:1.2">Diagnóstico de Empleabilidad<br>y Demanda Laboral Local</h1>${paragraphs}<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0"><tr><td style="background:#287c98;border-radius:8px"><a href="${safeUrl}/diagnostico" style="display:inline-block;padding:14px 22px;color:#fff;text-decoration:none;font-weight:bold;font-size:13px">RESPONDER EL DIAGNÓSTICO →</a></td></tr></table><p style="font-size:11px;color:#7a898f">O copie este enlace en su navegador:<br>${safeUrl}/diagnostico</p></td></tr><tr><td style="padding:18px 34px;background:#104b5e;color:#d8e8ec;font-size:11px">Programa de Empleabilidad · Minera Centinela<br>Antofagasta Minerals</td></tr></table></td></tr></table></body></html>`;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return NextResponse.json({ error: "El correo aún no está configurado. Agrega RESEND_API_KEY y EMAIL_FROM en Vercel." }, { status: 503 });

  try {
    const body = await request.json() as { recipients?: Recipient[]; subject?: string; message?: string; template?: string };
    const subject = body.subject?.trim().slice(0, 180) || "";
    const message = body.message?.trim().slice(0, 10000) || "";
    const template = ["invitation", "reminder", "custom", "test"].includes(body.template || "") ? String(body.template) : "custom";
    const deduplicated = new Map<string, { name: string; email: string; cc: string[] }>();
    for (const item of body.recipients || []) {
      const email = item.email?.trim().toLowerCase() || "";
      if (!emailPattern.test(email)) continue;
      const cc = [...new Set((item.cc || []).map((value) => value.trim().toLowerCase()).filter((value) => emailPattern.test(value) && value !== email))].slice(0, 10);
      deduplicated.set(email, { name: item.name?.trim().slice(0, 120) || "", email, cc });
    }
    const recipients = [...deduplicated.values()].slice(0, 100);
    if (!subject || !message || recipients.length === 0) return NextResponse.json({ error: "Agrega destinatarios, asunto y mensaje" }, { status: 400 });

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
    const payload = recipients.map((recipient) => ({ from, to: [recipient.email], ...(recipient.cc.length ? { cc: recipient.cc } : {}), subject: personalize(subject, recipient), html: emailHtml(message, recipient, siteUrl) }));
    const providerResponse = await fetch("https://api.resend.com/emails/batch", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify(payload) });
    const providerData = await providerResponse.json().catch(() => ({}));
    const sql = getSql();
    if (!providerResponse.ok) {
      const providerError = typeof providerData.message === "string" ? providerData.message.slice(0, 1000) : "El proveedor rechazó el envío";
      await sql`INSERT INTO email_campaigns (created_by,subject,template,recipient_count,status,error) VALUES (${session.id},${subject},${template},${recipients.length},'failed',${providerError})`;
      return NextResponse.json({ error: providerError }, { status: 502 });
    }
    const rows = await sql`INSERT INTO email_campaigns (created_by,subject,template,recipient_count,status) VALUES (${session.id},${subject},${template},${recipients.length},'sent') RETURNING id,subject,template,recipient_count,status,error,created_at`;
    return NextResponse.json({ ok: true, sent: recipients.length, campaign: rows[0] });
  } catch (error) {
    console.error("admin_email_send", error);
    return NextResponse.json({ error: "No fue posible completar el envío" }, { status: 500 });
  }
}
