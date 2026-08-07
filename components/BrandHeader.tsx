import Image from "next/image";
import Link from "next/link";

export function BrandHeader({ showAccess = false }: { showAccess?: boolean }) {
  return (
    <header className="site-header">
      <div className="brand-rule" />
      <div className="site-header__inner">
        <Link href="/" className="brand-lockup" aria-label="Programa de Empleabilidad, inicio">
          <Image src="/logo-centinela.png" width={190} height={67} alt="Centinela · Antofagasta Minerals" priority />
          <span className="brand-lockup__divider" />
          <span className="brand-lockup__program mono">Programa de Empleabilidad</span>
        </Link>
        {showAccess && <Link href="/auth" className="outline-btn">Acceso equipo</Link>}
      </div>
    </header>
  );
}
