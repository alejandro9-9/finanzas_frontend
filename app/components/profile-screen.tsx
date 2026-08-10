"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppTopbar } from "./app-topbar";
import {
  getCurrentUser,
  logout,
  resendEmailVerification,
  updateCurrentUser,
} from "../api/auth";
import { ApiError } from "../api/client";
import type { UserResponse } from "../api/contracts";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setName(currentUser.name);
        setEmail(currentUser.email);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          await logout();
          router.replace("/");
          return;
        }

        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "No pudimos cargar tu perfil.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfile();
  }, [router]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setError("");
    setNotice("");
    setIsSaving(true);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const emailChanged = normalizedEmail !== user.email.toLowerCase();

    try {
      await updateCurrentUser({ name: normalizedName, email: normalizedEmail });

      if (emailChanged) {
        try {
          await resendEmailVerification({ email: normalizedEmail });
        } finally {
          await logout();
          router.push(`/verificar-correo?email=${encodeURIComponent(normalizedEmail)}`);
        }
        return;
      }

      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
      setName(updatedUser.name);
      setEmail(updatedUser.email);
      setNotice("Tus datos fueron actualizados correctamente.");
      window.dispatchEvent(
        new CustomEvent("flujo:user-updated", { detail: { name: updatedUser.name } }),
      );
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No pudimos guardar los cambios. Inténtalo nuevamente.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  const initial = user?.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <main className="profile-page">
      <AppTopbar userName={user?.name} />

      <section className="profile-hero">
        <div>
          <p className="eyebrow">CONFIGURACIÓN PERSONAL</p>
          <h1>Tu perfil</h1>
        </div>
        <p>Consulta y actualiza la información asociada a tu cuenta de Flujo.</p>
      </section>

      {isLoading ? (
        <section className="profile-loading" aria-live="polite">Cargando tu información...</section>
      ) : error && !user ? (
        <section className="profile-message profile-message-error" role="alert">{error}</section>
      ) : user ? (
        <section className="profile-layout">
          <aside className="profile-summary">
            <span className="profile-avatar" aria-hidden="true">{initial}</span>
            <div>
              <p className="eyebrow">MI CUENTA</p>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
            </div>

            <dl className="profile-facts">
              <div>
                <dt>Estado</dt>
                <dd className="profile-status"><i /> Activa</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>{user.emailVerified ? "Verificado" : "Pendiente"}</dd>
              </div>
              <div>
                <dt>Miembro desde</dt>
                <dd>{formatDate(user.createdAt)}</dd>
              </div>
            </dl>
          </aside>

          <div className="profile-editor">
            <div className="profile-editor-heading">
              <div>
                <p className="eyebrow">DATOS PERSONALES</p>
                <h2>Edita tu información</h2>
              </div>
              <span>Última actualización: {formatDate(user.updatedAt)}</span>
            </div>

            <form className="profile-form" onSubmit={handleSave}>
              <label htmlFor="profile-name">
                Nombre
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </label>

              <label htmlFor="profile-email">
                Correo electrónico
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
                <small>Si cambias el correo, deberás verificar la nueva dirección.</small>
              </label>

              {notice ? <p className="profile-message profile-message-success" role="status">{notice}</p> : null}
              {error ? <p className="profile-message profile-message-error" role="alert">{error}</p> : null}

              <div className="profile-actions">
                <button
                  className="profile-save"
                  type="submit"
                  disabled={isSaving || !name.trim() || !email.trim()}
                >
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button className="profile-logout" type="button" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}
    </main>
  );
}
