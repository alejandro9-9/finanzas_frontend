"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "Panel" },
  { href: "/creditos", label: "Créditos" },
  { href: "/inversiones", label: "Inversiones" },
  { href: "/ayudanos-a-mejorar", label: "Ayúdanos a mejorar" },
];

const sectionDetails: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Panel financiero",
    description: "Control general de tu capital",
  },
  "/creditos": {
    title: "Gestión del crédito",
    description: "Cuotas, vencimientos y avance de pagos",
  },
  "/inversiones": {
    title: "Gestión de inversiones",
    description: "Operaciones, capital y rentabilidad",
  },
  "/ayudanos-a-mejorar": {
    title: "Ayúdanos a mejorar",
    description: "Construyamos una mejor experiencia",
  },
};

type AppTopbarProps = {
  userName?: string;
};

export function AppTopbar({ userName = "Usuario" }: AppTopbarProps) {
  const pathname = usePathname();
  const initial = userName.trim().charAt(0).toUpperCase() || "U";
  const currentSection = sectionDetails[pathname] ?? sectionDetails["/"];

  return (
    <header className="site-header">
      <div className="app-topbar">
        <Link className="brand brand-link" href="/" aria-label="Ir al panel">
          <span>F</span>
          <strong>Flujo</strong>
        </Link>

        <nav className="main-navigation" aria-label="Navegación principal">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "active" : ""}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="topbar-user" aria-label={`Usuario actual: ${userName}`}>
          <span className="user-avatar">{initial}</span>
          <span className="user-copy">
            <small>Mi cuenta</small>
            <strong>{userName}</strong>
          </span>
        </div>
      </div>

      <div className="section-strip">
        <div className="section-strip-inner">
          <div>
            <strong>{currentSection.title}</strong>
            <span>{currentSection.description}</span>
          </div>
          <span className="local-data-status">
            <i /> Datos guardados en este dispositivo
          </span>
        </div>
      </div>
    </header>
  );
}
