import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/LoginForm";
import "./auth.css";

export const metadata = { title: "Acceso equipo · PROGRAMA DE EMPLEABILIDAD" };

export default async function AuthPage() {
  if (await getSession()) redirect("/admin");
  return <main className="auth-page"><div className="auth-watermark">M M M</div><section className="auth-card"><div className="brand-rule" /><div className="auth-card__body"><Image src="/logo-centinela.png" width={165} height={58} alt="Centinela · Antofagasta Minerals" priority /><p className="auth-program mono">Programa de Empleabilidad</p><p className="auth-eyebrow mono">Panel interno</p><h1>Iniciar sesión</h1><LoginForm /><p className="auth-help">Las cuentas las crea un administrador. No hay registro público.</p><Link href="/" className="back-link">← Volver al sitio</Link></div></section></main>;
}
