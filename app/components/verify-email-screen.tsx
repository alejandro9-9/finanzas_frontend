"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { resendEmailVerification, verifyEmail } from "../api/auth";
import { ApiError } from "../api/client";

export function VerifyEmailScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const pendingEmail = new URLSearchParams(window.location.search).get("email");
    if (pendingEmail) setEmail(pendingEmail);
  }, []);

  function getErrorMessage(requestError: unknown) {
    return requestError instanceof ApiError
      ? requestError.message
      : "Ocurrió un problema. Inténtalo nuevamente.";
  }

  async function handleVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      await verifyEmail({ email: email.trim(), code });
      setIsCompleted(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError("");
    setNotice("");

    if (!email.trim()) {
      setError("Escribe el correo con el que creaste tu cuenta.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resendEmailVerification({ email: email.trim() });
      setNotice("Enviamos un nuevo código a tu correo.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page register-page verification-page">
      <section className="login-story register-story" aria-labelledby="verification-title">
        <Link className="login-brand" href="/" aria-label="Volver al inicio de sesión">
          <span>F</span>
          <strong>Flujo</strong>
        </Link>

        <div className="login-story-copy">
          <p className="eyebrow">UN ÚLTIMO PASO</p>
          <h1 id="verification-title">
            Confirma que
            <br />
            eres tú.
          </h1>
          <p>
            Protegemos tu información financiera verificando el correo asociado
            a tu cuenta antes de permitir el acceso.
          </p>
        </div>

        <div className="register-benefits" aria-label="Características de la verificación">
          <span><i>01</i> Código personal de seis dígitos</span>
          <span><i>02</i> Vigencia limitada por seguridad</span>
          <span><i>03</i> Activación inmediata de la cuenta</span>
        </div>

        <p className="login-copyright">© 2026 Flujo. Finanzas claras.</p>
      </section>

      <section className="login-access register-access" aria-label="Verificar correo">
        <div className="login-access-inner">
          <span className="login-secure-status">
            <i /> Verificación segura
          </span>

          {!isCompleted ? (
            <div className="verification-step standalone-verification-step">
              <div className="verification-icon" aria-hidden="true">@</div>
              <div className="login-heading register-heading">
                <p className="eyebrow">VERIFICA TU CORREO</p>
                <h2>Ingresa tu código</h2>
                <p>Usa el correo con el que creaste tu cuenta y el código que recibiste.</p>
              </div>

              {notice ? <p className="login-notice" role="status">{notice}</p> : null}

              <form className="login-form" onSubmit={handleVerification}>
                <label htmlFor="verification-email">
                  Correo electrónico
                  <input
                    id="verification-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nombre@correo.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <label htmlFor="standalone-verification-code">
                  Código de verificación
                  <input
                    className="verification-code-input"
                    id="standalone-verification-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    required
                  />
                </label>

                {error ? <p className="login-error" role="alert">{error}</p> : null}

                <button
                  className="login-submit"
                  type="submit"
                  disabled={isSubmitting || code.length !== 6}
                >
                  <span>{isSubmitting ? "Verificando..." : "Verificar mi cuenta"}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <button
                className="verification-resend"
                type="button"
                onClick={handleResend}
                disabled={isSubmitting}
              >
                No recibí el código, enviar uno nuevo
              </button>

              <p className="login-register-prompt">
                ¿Aún no tienes una cuenta? <Link href="/registro">Crear cuenta</Link>
              </p>
            </div>
          ) : (
            <div className="registration-completed">
              <span aria-hidden="true">✓</span>
              <p className="eyebrow">CUENTA VERIFICADA</p>
              <h2>Todo está listo</h2>
              <p>Tu correo fue confirmado. Ya puedes ingresar a Flujo.</p>
              <Link className="registration-login-link" href="/">
                <span>Ir al inicio de sesión</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
