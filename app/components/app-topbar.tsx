"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, logout } from "../api/auth";
import { ApiError } from "../api/client";
import type { UserRole } from "../api/contracts";

const navigation = [
  { href: "/panel", label: "Panel" },
  { href: "/creditos", label: "Créditos" },
  { href: "/inversiones", label: "Inversiones" },
  { href: "/ayudanos-a-mejorar", label: "Ayúdanos a mejorar" },
];

const sectionDetails: Record<string, { title: string; description: string }> = {
  "/panel": {
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
  "/perfil": {
    title: "Mi perfil",
    description: "Información personal y seguridad de la cuenta",
  },
  "/administracion": {
    title: "Administración",
    description: "Usuarios, accesos y estado de la plataforma",
  },
};

type AppTopbarProps = {
  userName?: string;
  userRole?: UserRole;
};

export function AppTopbar({
  userName = "Usuario",
  userRole = "User",
}: AppTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUserName, setCurrentUserName] = useState(userName);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(userRole);
  const initial = currentUserName.trim().charAt(0).toUpperCase() || "U";
  const currentSection = sectionDetails[pathname] ?? sectionDetails["/panel"];

  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUserName(user.name);
      setCurrentUserRole(user.role);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await logout();
        router.replace("/");
      }
    }
  }, [router]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadCurrentUser();
    });

    function handleUserUpdated(event: Event) {
      const updatedUser = (event as CustomEvent<{ name: string }>).detail;
      if (updatedUser?.name) setCurrentUserName(updatedUser.name);
    }

    window.addEventListener("flujo:user-updated", handleUserUpdated);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("flujo:user-updated", handleUserUpdated);
    };
  }, [loadCurrentUser]);

  async function handleQuickLogout() {
    await logout();
    router.replace("/");
  }

  const visibleNavigation = currentUserRole === "Administrator"
    ? [
        ...navigation.filter((item) => item.href !== "/ayudanos-a-mejorar"),
        { href: "/administracion", label: "Administración" },
      ]
    : navigation;

  return (
    <header className="site-header">
      <div className="app-topbar">
        <Link className="brand brand-link" href="/panel" aria-label="Ir al panel">
          <span>F</span>
          <strong>Flujo</strong>
        </Link>

        <nav className="main-navigation" aria-label="Navegación principal">
          {visibleNavigation.map((item) => {
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

        <div className="topbar-account-actions">
          <Link
            className="topbar-user"
            href="/perfil"
            aria-label={`Abrir perfil de ${currentUserName}`}
            aria-current={pathname === "/perfil" ? "page" : undefined}
          >
            <span className="user-avatar">{initial}</span>
            <span className="user-copy">
              <small>Mi cuenta</small>
              <strong>{currentUserName}</strong>
            </span>
          </Link>

          <button
            className="topbar-logout"
            type="button"
            onClick={handleQuickLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <span aria-hidden="true">↗</span>
            Salir
          </button>
        </div>
      </div>

      <div className="section-strip">
        <div className="section-strip-inner">
          <div>
            <strong>{currentSection.title}</strong>
            <span>{currentSection.description}</span>
          </div>
          <span className="local-data-status">
            <i /> Datos sincronizados con tu cuenta
          </span>
        </div>
      </div>
    </header>
  );
}
