"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  blockAdminUser,
  getActiveUserCount,
  getAdminUsers,
} from "../api/admin";
import { getCurrentUser, logout } from "../api/auth";
import { ApiError } from "../api/client";
import type { AdminUserResponse, UserResponse, UserStatus } from "../api/contracts";
import { AppTopbar } from "./app-topbar";

type StatusFilter = "all" | "active" | "pending" | "blocked";

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const statusLabels: Record<UserStatus, string> = {
  pendingEmailConfirmation: "Pendiente",
  active: "Activo",
  blocked: "Bloqueado",
};

function getStatusFilter(user: AdminUserResponse): StatusFilter {
  if (!user.isActive || user.status === "blocked") return "blocked";
  if (user.status === "pendingEmailConfirmation") return "pending";
  return "active";
}

export function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocking, setIsBlocking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const user = await getCurrentUser();
      if (user.role !== "Administrator") {
        router.replace("/panel");
        return;
      }

      setCurrentUser(user);
      const [adminUsers, count] = await Promise.all([
        getAdminUsers(),
        getActiveUserCount(),
      ]);
      setUsers(adminUsers);
      setActiveCount(count.total);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await logout();
        router.replace("/");
        return;
      }

      if (requestError instanceof ApiError && requestError.status === 403) {
        router.replace("/panel");
        return;
      }

      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No pudimos cargar la administración de usuarios.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadDashboard();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loadDashboard]);

  const stats = useMemo(() => ({
    total: users.length,
    active: activeCount,
    pending: users.filter(
      (user) => user.status === "pendingEmailConfirmation",
    ).length,
    blocked: users.filter((user) => !user.isActive || user.status === "blocked").length,
    verified: users.filter((user) => user.emailVerified).length,
  }), [activeCount, users]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery = !normalizedQuery ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filter === "all" || getStatusFilter(user) === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, users]);

  async function handleBlockUser() {
    if (!selectedUser) return;

    setIsBlocking(true);
    setError("");
    setNotice("");

    try {
      await blockAdminUser(selectedUser.id);
      setUsers((current) => current.map((user) =>
        user.id === selectedUser.id
          ? { ...user, isActive: false, status: "blocked" }
          : user));
      setActiveCount((current) => Math.max(0, current - 1));
      setNotice(`${selectedUser.name} fue bloqueado correctamente.`);
      setSelectedUser(null);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No pudimos bloquear al usuario.",
      );
    } finally {
      setIsBlocking(false);
    }
  }

  if (isLoading || !currentUser) {
    return (
      <main className="admin-page">
        <AppTopbar />
        <section className="admin-loading" role="status">
          <span aria-hidden="true">•••</span>
          <p className="eyebrow">ACCESO ADMINISTRATIVO</p>
          <h1>{isLoading ? "Cargando usuarios" : "Redirigiendo"}</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <AppTopbar userName={currentUser.name} />

      <section className="admin-hero">
        <div>
          <p className="eyebrow">CENTRO DE CONTROL</p>
          <h1>Administración de usuarios</h1>
        </div>
        <p>
          Supervisa el acceso a Flujo, revisa las verificaciones pendientes y
          bloquea cuentas cuando sea necesario.
        </p>
      </section>

      <section className="admin-stats" aria-label="Estadísticas de usuarios">
        <article>
          <span>Total registrados</span>
          <strong>{stats.total}</strong>
          <small>Usuarios históricos</small>
        </article>
        <article className="admin-stat-highlight">
          <span>Usuarios activos</span>
          <strong>{stats.active}</strong>
          <small>Con acceso habilitado</small>
        </article>
        <article>
          <span>Por verificar</span>
          <strong>{stats.pending}</strong>
          <small>Correo pendiente</small>
        </article>
        <article>
          <span>Bloqueados</span>
          <strong>{stats.blocked}</strong>
          <small>Sin acceso a la plataforma</small>
        </article>
        <article>
          <span>Correos verificados</span>
          <strong>{stats.verified}</strong>
          <small>Identidad confirmada</small>
        </article>
      </section>

      <section className="admin-users-panel">
        <div className="admin-users-heading">
          <div>
            <p className="eyebrow">DIRECTORIO</p>
            <h2>Usuarios de Flujo</h2>
          </div>
          <span>{filteredUsers.length} resultados</span>
        </div>

        <div className="admin-toolbar">
          <label>
            <span>Buscar usuario</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre o correo electrónico"
            />
          </label>

          <div className="admin-filters" role="group" aria-label="Filtrar usuarios">
            {([
              ["all", "Todos"],
              ["active", "Activos"],
              ["pending", "Pendientes"],
              ["blocked", "Bloqueados"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filter === value ? "active" : ""}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {notice ? <p className="admin-notice" role="status">{notice}</p> : null}
        {error ? <p className="admin-error" role="alert">{error}</p> : null}

        <div className="admin-table-wrapper">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Verificación</th>
                <th>Rol</th>
                <th>Registro</th>
                <th><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isCurrentAdmin = user.id === currentUser.id;
                const isBlocked = !user.isActive || user.status === "blocked";

                return (
                  <tr key={user.id}>
                    <td>
                      <span className="admin-user-avatar">
                        {user.name.trim().charAt(0).toUpperCase() || "U"}
                      </span>
                      <span className="admin-user-identity">
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </span>
                    </td>
                    <td>
                      <span className={`admin-user-status status-${getStatusFilter(user)}`}>
                        <i /> {statusLabels[user.status]}
                      </span>
                    </td>
                    <td>
                      <span className={user.emailVerified ? "verified" : "unverified"}>
                        {user.emailVerified ? "Verificado" : "Pendiente"}
                      </span>
                    </td>
                    <td>
                      <span className="admin-role">
                        {user.role === "Administrator" ? "Administrador" : "Usuario"}
                      </span>
                    </td>
                    <td>{dateFormatter.format(new Date(user.createdAt))}</td>
                    <td>
                      <button
                        className="admin-block-button"
                        type="button"
                        disabled={isCurrentAdmin || isBlocked}
                        onClick={() => setSelectedUser(user)}
                      >
                        {isCurrentAdmin ? "Tu cuenta" : isBlocked ? "Bloqueado" : "Bloquear"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 ? (
            <div className="admin-empty">
              <strong>No encontramos usuarios</strong>
              <span>Prueba con otro nombre, correo o filtro.</span>
            </div>
          ) : null}
        </div>
      </section>

      {selectedUser ? (
        <div className="admin-dialog-backdrop" role="presentation">
          <section
            className="admin-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="block-user-title"
            aria-describedby="block-user-description"
          >
            <span className="admin-dialog-icon" aria-hidden="true">!</span>
            <p className="eyebrow">CONFIRMAR BLOQUEO</p>
            <h2 id="block-user-title">¿Bloquear a {selectedUser.name}?</h2>
            <p id="block-user-description">
              La cuenta perderá acceso inmediatamente. Sus datos financieros no
              se eliminarán y permanecerán disponibles en la base de datos.
            </p>
            <div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                disabled={isBlocking}
              >
                Cancelar
              </button>
              <button
                className="confirm-block"
                type="button"
                onClick={() => void handleBlockUser()}
                disabled={isBlocking}
              >
                {isBlocking ? "Bloqueando..." : "Sí, bloquear usuario"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
