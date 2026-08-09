"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { confirmPasswordReset, requestPasswordReset } from "../api/auth";
import { ApiError } from "../api/client";

type PasswordResetStep = "request" | "reset" | "completed";

export function PasswordResetScreen() {
  const [step, setStep] = useState<PasswordResetStep>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      await requestPasswordReset({ email: email.trim() });
      setStep("reset");
      setNotice("Si tu cuenta está activa y verificada, recibirás un código de recuperación.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      setError("La contraseña debe contener entre 8 y 128 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordReset({
        email: email.trim(),
        code,
        newPassword,
      });
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
      await requestPasswordReset({ email: email.trim() });
      setCode("");
      setNotice("Solicitamos un nuevo código. Revisa tu correo.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page register-page password-reset-page">
      <section className="login-story register-story" aria-labelledby="password-reset-title">
        <Link className="login-brand" href="/" aria-label="Volver al inicio de sesión">
          <span>F</span>
          <strong>Flujo</strong>
        </Link>

        <div className="login-story-copy">
          <p className="eyebrow">RECUPERA EL ACCESO</p>
          <h1 id="password-reset-title">
            Vuelve a tener
            <br />
            el control.
          </h1>
          <p>
            Confirma que eres el propietario de la cuenta mediante un código
            temporal antes de crear una nueva contraseña.
          </p>
        </div>

        <div className="register-benefits" aria-label="Seguridad de recuperación">
          <span><i>01</i> Código enviado únicamente a tu correo</span>
          <span><i>02</i> Vigencia e intentos limitados</span>
          <span><i>03</i> Nueva contraseña protegida con hash</span>
        </div>

        <p className="login-copyright">© 2026 Flujo. Finanzas claras.</p>
      </section>

      <section className="login-access register-access" aria-label="Recuperar contraseña">
        <div className="login-access-inner">
          <span className="login-secure-status">
            <i /> Recuperación segura
          </span>

          {step === "request" ? (
            <>
              <div className="login-heading register-heading password-reset-heading">
                <p className="eyebrow">¿OLVIDASTE TU CONTRASEÑA?</p>
                <h2>Recupera tu cuenta</h2>
                <p>Ingresa el correo asociado a tu cuenta y te enviaremos un código.</p>
              </div>

              <form className="login-form" onSubmit={handleRequest}>
                <label htmlFor="password-reset-email">
                  Correo electrónico
                  <input
                    id="password-reset-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nombre@correo.com"
                    autoComplete="email"
                    required
                  />
                </label>

                {error ? <p className="login-error" role="alert">{error}</p> : null}

                <button className="login-submit" type="submit" disabled={isSubmitting}>
                  <span>{isSubmitting ? "Enviando..." : "Enviar código"}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <p className="login-register-prompt">
                ¿Recordaste tu contraseña? <Link href="/">Iniciar sesión</Link>
              </p>
            </>
          ) : null}

          {step === "reset" ? (
            <div className="password-reset-step">
              <div className="verification-icon" aria-hidden="true">#</div>
              <div className="login-heading register-heading">
                <p className="eyebrow">CREA UNA NUEVA CONTRASEÑA</p>
                <h2>Valida tu código</h2>
                <p>Escribe el código enviado a <strong>{email}</strong> y define tu nueva contraseña.</p>
              </div>

              {notice ? <p className="login-notice" role="status">{notice}</p> : null}

              <form className="login-form register-form" onSubmit={handleReset}>
                <label htmlFor="password-reset-code">
                  Código de recuperación
                  <input
                    className="verification-code-input"
                    id="password-reset-code"
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

                <label htmlFor="new-password">
                  Nueva contraseña
                  <span className="login-password-field">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
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

                <label htmlFor="confirm-new-password">
                  Confirma tu nueva contraseña
                  <span className="login-password-field">
                    <input
                      id="confirm-new-password"
                      type={showConfirmation ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repite la nueva contraseña"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
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

                <button
                  className="login-submit"
                  type="submit"
                  disabled={isSubmitting || code.length !== 6}
                >
                  <span>{isSubmitting ? "Actualizando..." : "Guardar nueva contraseña"}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <button className="verification-resend" type="button" onClick={handleResend} disabled={isSubmitting}>
                El código no funciona o expiró, enviar uno nuevo
              </button>
            </div>
          ) : null}

          {step === "completed" ? (
            <div className="registration-completed">
              <span aria-hidden="true">✓</span>
              <p className="eyebrow">CONTRASEÑA ACTUALIZADA</p>
              <h2>Acceso recuperado</h2>
              <p>Tu nueva contraseña fue guardada. Ya puedes iniciar sesión.</p>
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
