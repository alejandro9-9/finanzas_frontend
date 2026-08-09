"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, resendEmailVerification, verifyEmail } from "../api/auth";
import { ApiError } from "../api/client";

type LoginStep = "credentials" | "verification";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<LoginStep>("credentials");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      router.push("/panel");
    } catch (requestError) {
      if (
        requestError instanceof ApiError &&
        requestError.problem?.code === "UserErrors.EmailNotVerified"
      ) {
        setStep("verification");
        setError("");
        setNotice("Tu cuenta existe, pero todavía falta verificar el correo.");
        return;
      }

      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No pudimos iniciar sesión. Inténtalo nuevamente.",
      );
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
      await login({ email: email.trim(), password });
      router.push("/panel");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No pudimos verificar el código. Inténtalo nuevamente.",
      );
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
      setCode("");
      setNotice("Solicitamos un nuevo código. Revisa tu correo.");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No pudimos enviar un nuevo código. Inténtalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function returnToCredentials() {
    setStep("credentials");
    setCode("");
    setError("");
    setNotice("");
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-labelledby="login-title">
        <div className="login-brand">
          <span>F</span>
          <strong>Flujo</strong>
        </div>

        <div className="login-story-copy">
          <p className="eyebrow">CONTROL FINANCIERO PERSONAL</p>
          <h1 id="login-title">
            Tu dinero,
            <br />
            bajo control.
          </h1>
          <p>
            Organiza tus créditos, controla cada cuota y conoce el rendimiento
            real de tus inversiones desde un solo lugar.
          </p>
        </div>

        <div className="login-finance-card" aria-hidden="true">
          <div className="login-card-head">
            <span>Balance disponible</span>
            <i />
          </div>
          <strong>S/ 24,850</strong>
          <div className="login-chart">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="login-card-foot">
            <span>Capital en movimiento</span>
            <strong>+12.4%</strong>
          </div>
        </div>

        <p className="login-copyright">© 2026 Flujo. Finanzas claras.</p>
      </section>

      <section className="login-access" aria-label="Inicio de sesión">
        <div className="login-access-inner">
          <span className="login-secure-status">
            <i /> Acceso seguro
          </span>

          {step === "credentials" ? (
            <>
              <div className="login-heading">
                <p className="eyebrow">BIENVENIDO DE VUELTA</p>
                <h2>Ingresa a tu cuenta</h2>
                <p>Continúa donde lo dejaste y mantén tus finanzas al día.</p>
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
                <label htmlFor="login-email">
                  Correo electrónico
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nombre@correo.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <label htmlFor="login-password">
                  Contraseña
                  <span className="login-password-field">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Ingresa tu contraseña"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={showPassword}
                    >
                      <span
                        className={`password-eye ${showPassword ? "is-visible" : "is-hidden"}`}
                        aria-hidden="true"
                      />
                    </button>
                  </span>
                </label>

                <div className="login-forgot-password">
                  <Link href="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
                </div>

                {error ? (
                  <p className="login-error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button className="login-submit" type="submit" disabled={isSubmitting}>
                  <span>{isSubmitting ? "Ingresando..." : "Ingresar a Flujo"}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <p className="login-register-prompt">
                ¿Aún no tienes una cuenta? <Link href="/registro">Crear cuenta</Link>
              </p>

              <p className="login-register-prompt login-verification-prompt">
                ¿Ya recibiste un código? <Link href="/verificar-correo">Verificar correo</Link>
              </p>
            </>
          ) : (
            <div className="login-inline-verification">
              <div className="verification-icon" aria-hidden="true">@</div>

              <div className="login-heading">
                <p className="eyebrow">CUENTA PENDIENTE</p>
                <h2>Verifica tu correo</h2>
                <p>Ingresa el código de seis dígitos enviado a <strong>{email}</strong>.</p>
              </div>

              {notice ? <p className="login-notice" role="status">{notice}</p> : null}

              <form className="login-form" onSubmit={handleVerification}>
                <label htmlFor="login-verification-code">
                  Código de verificación
                  <input
                    className="verification-code-input"
                    id="login-verification-code"
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
                  <span>{isSubmitting ? "Verificando..." : "Verificar e ingresar"}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <button
                className="verification-resend"
                type="button"
                onClick={handleResend}
                disabled={isSubmitting}
              >
                El código no funciona o expiró, enviar uno nuevo
              </button>

              <button
                className="verification-back"
                type="button"
                onClick={returnToCredentials}
                disabled={isSubmitting}
              >
                Volver y cambiar el correo
              </button>
            </div>
          )}

          <div className="login-trust-note">
            <span aria-hidden="true">✓</span>
            <p>
              <strong>Tus datos están protegidos</strong>
              La sesión se procesa de forma segura y privada.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
