"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout } from "../api/auth";
import { ApiError } from "../api/client";
import { createFeedbackMessage } from "../api/feedback";
import type { UserResponse } from "../api/contracts";
import { AppTopbar } from "./app-topbar";

const MAX_MESSAGE_LENGTH = 2000;

export function FeedbackScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        setUser(await getCurrentUser());
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          await logout();
          router.replace("/");
          return;
        }

        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "No pudimos cargar tu cuenta.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadUser();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedMessage = message.trim();
    if (!normalizedMessage) return;

    setError("");
    setNotice("");
    setIsSending(true);

    try {
      await createFeedbackMessage({ message: normalizedMessage });
      setMessage("");
      setNotice("Gracias. Tu mensaje fue enviado al equipo de Flujo.");
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await logout();
        router.replace("/");
        return;
      }

      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No pudimos enviar tu mensaje. Inténtalo nuevamente.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="feedback-page">
      <AppTopbar userName={user?.name} />

      <section className="feedback-hero">
        <div>
          <p className="eyebrow">TU OPINIÓN IMPORTA</p>
          <h1>Ayúdanos a mejorar</h1>
        </div>
        <p>
          Cuéntanos qué cambiarías o qué función necesitas. El equipo
          administrador recibirá tu mensaje junto con los datos de tu cuenta.
        </p>
      </section>

      {isLoading ? (
        <section className="feedback-loading" aria-live="polite">
          Preparando el formulario...
        </section>
      ) : user ? (
        <section className="feedback-layout">
          <aside className="feedback-context">
            <span aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span>
            <p className="eyebrow">MENSAJE IDENTIFICADO</p>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <small>
              Usaremos estos datos únicamente para saber quién envió el mensaje.
            </small>
          </aside>

          <form className="feedback-form" onSubmit={handleSubmit}>
            <div className="feedback-form-heading">
              <div>
                <p className="eyebrow">NUEVO MENSAJE</p>
                <h2>¿Qué podemos hacer mejor?</h2>
              </div>
              <span>{message.length}/{MAX_MESSAGE_LENGTH}</span>
            </div>

            <label htmlFor="feedback-message">
              Mensaje
              <textarea
                id="feedback-message"
                value={message}
                maxLength={MAX_MESSAGE_LENGTH}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe tu idea, inconveniente o sugerencia..."
                required
              />
            </label>

            {notice ? (
              <p className="feedback-notice" role="status">{notice}</p>
            ) : null}
            {error ? (
              <p className="feedback-error" role="alert">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSending || !message.trim()}
            >
              {isSending ? "Enviando..." : "Enviar mensaje"}
            </button>
          </form>
        </section>
      ) : error ? (
        <section className="feedback-error" role="alert">{error}</section>
      ) : null}
    </main>
  );
}
