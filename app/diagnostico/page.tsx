import { BrandHeader } from "@/components/BrandHeader";
import { DiagnosticForm } from "@/components/DiagnosticForm";
import "./diagnostico.css";

export const metadata = { title: "Diagnóstico de Empleabilidad y Demanda Laboral Local · PROGRAMA DE EMPLEABILIDAD" };

export default function DiagnosticoPage() {
  return (
    <>
      <BrandHeader />
      <main className="diagnostic-main">
        <section className="diagnostic-intro">
          <p className="eyebrow mono">Encuesta a empresas</p>
          <h1>Diagnóstico de Empleabilidad y Demanda<br className="desktop-break" /> Laboral Local</h1>
          <p className="diagnostic-lead">Con el objetivo de fortalecer el vínculo entre <strong>Minera Centinela</strong> y la comunidad local, hemos diseñado esta encuesta para identificar los perfiles laborales que actualmente requieren nuestros proveedores, así como los requisitos específicos para su contratación.</p>
          <div className="goal-grid">
            <article><span className="mono">01</span><strong>Entender las necesidades del sector</strong><p>Adaptar programas de formación a las competencias requeridas.</p></article>
            <article><span className="mono">02</span><strong>Diseñar capacitación relevante</strong><p>Preparar a la mano de obra local para los puestos disponibles.</p></article>
            <article><span className="mono">03</span><strong>Facilitar la búsqueda de talento</strong><p>Apoyar en la difusión de oportunidades y en la identificación de candidatos.</p></article>
          </div>
          <p className="duration">Toma alrededor de 5 minutos. Los campos marcados con * son obligatorios.</p>
        </section>
        <DiagnosticForm />
      </main>
    </>
  );
}
