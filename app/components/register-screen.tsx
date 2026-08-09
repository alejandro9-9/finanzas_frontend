"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  register,
  resendEmailVerification,
  verifyEmail,
} from "../api/auth";
import { ApiError } from "../api/client";

type RegisterStep = "account" | "verification" | "completed";

export function RegisterScreen() {
  const [step, setStep] = useState<RegisterStep>("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function getErrorMessage(requestError: unknown) {
    return requestError instanceof ApiError
      ? requestError.message
      : "Ocurrió un problema. Inténtalo nuevamente.";
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      setStep("verification");
      setNotice("Enviamos un código de 6 dígitos a tu correo.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      await verifyEmail({ email: email.trim(), code });
      setStep("completed");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      await resendEmailVerification({ email: email.trim() });
      setNotice("Te enviamos un nuevo código.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page register-page">
      <section className="login-story register-story" aria-labelledby="register-title">
        <Link className="login-brand" href="/" aria-label="Volver al inicio de sesión">
          <span>F</span>
          <strong>Flujo</strong>
        </Link>

        <div className="login-story-copy">
          <p className="eyebrow">EMPIEZA A ORGANIZARTE</p>
          <h1 id="register-title">
            Crea claridad
            <br />
            en tus finanzas.
          </h1>
          <p>
            Registra tus fuentes de capital y entiende cuánto inviertes,
            cuánto debes y cuánto estás ganando realmente.
          </p>
        </div>

        <div className="register-benefits" aria-label="Beneficios de Flujo">
          <span><i>01</i> Créditos y cuotas ordenados</span>
          <span><i>02</i> Inversiones con rentabilidad real</span>
          <span><i>03</i> Todo tu capital en un solo lugar</span>
        </div>

        <p className="login-copyright">© 2026 Flujo. Finanzas claras.</p>
      </section>

      <section className="login-access register-access" aria-label="Crear cuenta">
        <div className="login-access-inner">
          <span className="login-secure-status">
            <i /> Registro seguro
          </span>

          {step === "account" ? (
            <>
              <div className="login-heading register-heading">
                <p className="eyebrow">CREA TU CUENTA</p>
                <h2>Comienza en Flujo</h2>
                <p>Completa tus datos para crear tu espacio financiero.</p>
              </div>

              <form className="login-form register-form" onSubmit={handleRegister}>
                <label htmlFor="register-name">
                  Nombre
                  <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Tu nombre"
                    autoComplete="name"
                    required
                  />
                </label>

                <label htmlFor="register-email">
                  Correo electrónico
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nombre@correo.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <label htmlFor="register-password">
                  Contraseña
                  <span className="login-password-field">
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Crea una contraseña"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={showPassword}
                    >
                      <span className={`password-eye ${showPassword ? "is-visible" : "is-hidden"}`} aria-hidden="true" />
                    </button>
                  </span>
                </label>

                <label htmlFor="register-confirmation">
                  Confirma tu contraseña
                  <span className="login-password-field">
                    <input
                      id="register-confirmation"
                      type={showConfirmation ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repite tu contraseña"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmation((current) => !current)}
                      aria-label={showConfirmation ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={showConfirmation}
                    >
                      <span className={`password-eye ${showConfirmation ? "is-visible" : "is-hidden"}`} aria-hidden="true" />
                    </button>
                  </span>
                </label>

                {error ? <p className="login-error" role="alert">{error}</p> : null}

                <button className="login-submit" type="submit" disabled={isSubmitting}>
                  <span>{isSubmitting ? "Creando cuenta..." : "Crear mi cuenta"}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <p className="login-register-prompt">
                ¿Ya tienes una cuenta? <Link href="/">Iniciar sesión</Link>
              </p>

              <p className="login-register-prompt login-verification-prompt">
                ¿Ya tienes un código? <Link href="/verificar-correo">Verificar correo</Link>
              </p>
            </>
          ) : null}

          {step === "verification" ? (
            <div className="verification-step">
              <div className="verification-icon" aria-hidden="true">@</div>
              <div className="login-heading register-heading">
                <p className="eyebrow">VERIFICA TU CORREO</p>
                <h2>Revisa tu bandeja</h2>
                <p>Escribe el código que enviamos a <strong>{email}</strong>.</p>
              </div>

              {notice ? <p className="login-notice" role="status">{notice}</p> : null}

              <form className="login-form" onSubmit={handleVerification}>
                <label htmlFor="verification-code">
                  Código de verificación
                  <input
                    className="verification-code-input"
                    id="verification-code"
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

                <button className="login-submit" type="submit" disabled={isSubmitting || code.length !== 6}>
                  <span>{isSubmitting ? "Verificando..." : "Verificar correo"}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <button className="verification-resend" type="button" onClick={handleResend} disabled={isSubmitting}>
                No recibí el código, reenviar
              </button>
            </div>
          ) : null}

          {step === "completed" ? (
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
          ) : null}
        </div>
      </section>
    </main>
  );
}
