import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import "./home.css";

const pillars = [
  ["01", "Diagnóstico", "Levantamos con cada empresa los perfiles que demanda y los requisitos reales de contratación."],
  ["02", "Capacitación", "Diseñamos programas de formación ajustados a las brechas de competencias detectadas."],
  ["03", "Vinculación", "Apoyamos la difusión y búsqueda de perfiles laborales cuando su empresa lo requiere."]
];

export default function Home() {
  return (
    <>
      <BrandHeader showAccess />
      <main className="home-main">
        <section className="home-hero">
          <p className="eyebrow mono">Minera Centinela · Antofagasta Minerals</p>
          <h1>Programa de<br />Empleabilidad</h1>
          <div className="short-rule" />
          <p className="lead">Conectamos la demanda laboral real de las empresas del territorio con programas de capacitación y vinculación diseñados a su medida. Todo parte por un diagnóstico.</p>
          <div className="hero-cta">
            <Link href="/diagnostico" className="primary-btn">RESPONDER EL DIAGNÓSTICO <span>→</span></Link>
            <small>Toma ~5 minutos · Dirigido a empresas</small>
          </div>
        </section>
        <section className="pillar-grid" aria-label="Etapas del programa">
          {pillars.map(([n, title, text]) => (
            <article className="pillar" key={n}>
              <span className="pillar__number mono">{n}</span>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </section>
      </main>
      <footer className="home-footer mono">Programa de Empleabilidad · Minera Centinela</footer>
    </>
  );
}
