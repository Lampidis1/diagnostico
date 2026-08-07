"use client";

import { FormEvent, useState } from "react";
import type { AdminUserListItem } from "@/lib/types";

type Credential = { email: string; password: string; title: string };

export function UserManagement({ initialUsers, currentUserId, onUserCreated }: { initialUsers: AdminUserListItem[]; currentUserId: string; onUserCreated: () => void }) {
  const [users, setUsers] = useState(initialUsers);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "viewer" as "admin" | "viewer" });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [credential, setCredential] = useState<Credential | null>(null);
  const [copied, setCopied] = useState(false);

  async function createUser(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return setError(data.error || "No fue posible crear el usuario");
    setUsers((current) => [...current, data.user].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)));
    onUserCreated();
    setCreateOpen(false);
    setForm({ name: "", email: "", role: "viewer" });
    setCredential({ email: data.user.email, password: data.temporaryPassword, title: "Usuario creado" });
  }

  async function updateUser(user: AdminUserListItem, changes: Partial<Pick<AdminUserListItem, "name" | "role" | "active">>) {
    setBusyId(user.id);
    setError("");
    const response = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(changes) });
    const data = await response.json().catch(() => ({}));
    setBusyId("");
    if (!response.ok) return setError(data.error || "No fue posible actualizar el usuario");
    setUsers((current) => current.map((item) => item.id === user.id ? data.user : item));
  }

  async function resetPassword(user: AdminUserListItem) {
    if (!window.confirm(`Se invalidará la contraseña actual de ${user.email}. ¿Continuar?`)) return;
    setBusyId(user.id);
    setError("");
    const response = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "reset-password" }) });
    const data = await response.json().catch(() => ({}));
    setBusyId("");
    if (!response.ok) return setError(data.error || "No fue posible restablecer la contraseña");
    setCredential({ email: user.email, password: data.temporaryPassword, title: "Contraseña restablecida" });
  }

  async function copyPassword() {
    if (!credential) return;
    await navigator.clipboard.writeText(credential.password);
    setCopied(true);
  }

  return <section className="users-card">
    <div className="users-heading"><div><span className="mono">Control de acceso</span><h2>Usuarios del panel</h2><p>Crea cuentas y define quién puede administrar o sólo consultar la información.</p></div><button className="dash-primary" onClick={() => { setError(""); setCreateOpen(true); }}>+ Agregar usuario</button></div>
    {error && <p className="users-error" role="alert">{error}</p>}
    <div className="table-wrap"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Creado</th><th>Acciones</th></tr></thead><tbody>{users.map((account) => {
      const isSelf = account.id === currentUserId;
      const busy = busyId === account.id;
      return <tr key={account.id}><td><strong>{account.name}{isSelf ? " · Tú" : ""}</strong><small>{account.email}</small></td><td><select aria-label={`Rol de ${account.email}`} value={account.role} disabled={busy || isSelf} onChange={(event) => updateUser(account, { role: event.target.value as "admin" | "viewer" })}><option value="admin">Administrador</option><option value="viewer">Visualizador</option></select></td><td><span className={`user-status ${account.active ? "active" : "inactive"}`}>{account.active ? "Activo" : "Desactivado"}</span></td><td>{new Date(account.created_at).toLocaleDateString("es-CL")}</td><td><div className="user-actions"><button disabled={busy || isSelf} onClick={() => updateUser(account, { active: !account.active })}>{account.active ? "Desactivar" : "Activar"}</button><button disabled={busy} onClick={() => resetPassword(account)}>Nueva contraseña</button></div></td></tr>;
    })}</tbody></table></div>

    {createOpen && <div className="detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setCreateOpen(false)}><form className="user-modal" onSubmit={createUser} role="dialog" aria-modal="true" aria-labelledby="create-user-title"><header><div><span className="mono">Nueva cuenta</span><h2 id="create-user-title">Agregar usuario</h2></div><button type="button" aria-label="Cerrar" onClick={() => setCreateOpen(false)}>×</button></header><div className="user-form"><label>Nombre completo<input required maxLength={120} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label><label>Correo electrónico<input required type="email" maxLength={180} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label><label>Rol<select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as "admin" | "viewer" }))}><option value="viewer">Visualizador · consulta y exportación</option><option value="admin">Administrador · gestión completa</option></select></label><p>La plataforma generará una contraseña temporal segura y la mostrará una sola vez.</p>{error && <p className="users-error" role="alert">{error}</p>}</div><footer><button type="button" className="dash-ghost" onClick={() => setCreateOpen(false)}>Cancelar</button><button type="submit" className="dash-primary" disabled={saving}>{saving ? "Creando…" : "Crear usuario"}</button></footer></form></div>}

    {credential && <div className="detail-backdrop"><section className="user-modal credential-modal" role="dialog" aria-modal="true" aria-labelledby="credential-title"><header><div><span className="mono">Acceso temporal</span><h2 id="credential-title">{credential.title}</h2></div></header><div className="user-form"><p>Entrega estos datos al usuario por un canal seguro. La contraseña no volverá a mostrarse.</p><label>Correo<input readOnly value={credential.email} /></label><label>Contraseña temporal<div className="credential-row"><input readOnly value={credential.password} /><button type="button" onClick={copyPassword}>{copied ? "Copiada" : "Copiar"}</button></div></label></div><footer><button className="dash-primary" onClick={() => { setCredential(null); setCopied(false); }}>Entendido</button></footer></section></div>}
  </section>;
}
