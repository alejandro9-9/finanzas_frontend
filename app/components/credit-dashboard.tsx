"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "../finance/format";
import { useFinanceDashboard } from "../finance/use-finance-dashboard";
import { AppTopbar } from "./app-topbar";
import { FinanceDataGate } from "./finance-data-gate";

const paymentDate = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const DAY_IN_MILLISECONDS = 86_400_000;
const VISIBLE_PAYMENT_LIMIT = 5;

type DueStatus = {
  tone: "green" | "orange" | "red";
  label: string;
};

function daysUntilPayment(payment: Date, today: Date) {
  const paymentDay = Date.UTC(
    payment.getFullYear(),
    payment.getMonth(),
    payment.getDate(),
  );
  const currentDay = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return Math.round((paymentDay - currentDay) / DAY_IN_MILLISECONDS);
}

function getDueStatus(daysRemaining: number): DueStatus {
  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);
    return {
      tone: "red",
      label: `Vencida hace ${overdueDays} ${overdueDays === 1 ? "día" : "días"}`,
    };
  }
  if (daysRemaining === 0) return { tone: "red", label: "Vence hoy" };
  if (daysRemaining <= 12) {
    return { tone: "red", label: `Faltan ${daysRemaining} días` };
  }
  if (daysRemaining <= 20) {
    return { tone: "orange", label: `Faltan ${daysRemaining} días` };
  }
  return { tone: "green", label: `Faltan ${daysRemaining} días` };
}

export function CreditDashboard() {
  const finance = useFinanceDashboard();
  const [today, setToday] = useState<Date | null>(null);
  const [paymentView, setPaymentView] = useState<"pending" | "paid">(
    "pending",
  );
  const [showAllPayments, setShowAllPayments] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setToday(new Date()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!finance.hasLoaded) {
    return (
      <FinanceDataGate
        isLoading={finance.isLoading}
        error={finance.error}
        onRetry={() => void finance.refresh()}
      />
    );
  }
  const paidPaymentNumbers = new Set(finance.paidInstallments);
  const nextPaymentIndex = finance.paymentSchedule.findIndex(
    (installment) => !paidPaymentNumbers.has(installment.number),
  );
  const allPaymentsPaid =
    finance.paymentSchedule.length > 0 && nextPaymentIndex === -1;
  const nextPayment =
    nextPaymentIndex >= 0 ? finance.paymentSchedule[nextPaymentIndex] : null;
  const nextDueStatus =
    today && nextPayment
      ? getDueStatus(daysUntilPayment(nextPayment.date, today))
      : null;
  const pendingPayments = finance.paymentSchedule.filter(
    (installment) => !paidPaymentNumbers.has(installment.number),
  );
  const paidPayments = finance.paymentSchedule
    .filter((installment) => paidPaymentNumbers.has(installment.number))
    .reverse();
  const selectedPayments =
    paymentView === "pending" ? pendingPayments : paidPayments;
  const visiblePayments = showAllPayments
    ? selectedPayments
    : selectedPayments.slice(0, VISIBLE_PAYMENT_LIMIT);

  return (
    <main className="credit-page">
      <AppTopbar />
      {finance.error && <p className="finance-api-error" role="alert">{finance.error}</p>}

      <section className="credit-page-hero">
        <div>
          <p className="eyebrow">MIS CRÉDITOS</p>
          <h1>
            Tus créditos,
            <br />
            cuota por cuota.
          </h1>
        </div>
        <p>
          Revisa cuánto comenzaste debiendo, cuánto has pagado y qué cuotas
          están próximas a vencer.
        </p>
      </section>

      <section className="credit-page-switcher" aria-label="Créditos disponibles">
        <div>
          <span>Crédito mostrado</span>
          <select
            value={finance.activeCreditId ?? ""}
            onChange={(event) =>
              finance.setActiveCreditId(event.target.value)
            }
          >
            {finance.credits.map((credit) => (
              <option key={credit.id} value={credit.id}>
                {credit.name} · {money.format(credit.loan)}
              </option>
            ))}
          </select>
        </div>
        <Link href="/panel">+ Nuevo crédito</Link>
      </section>

      {finance.loan <= 0 ? (
        <section className="credit-empty-state">
          <span>i</span>
          <h2>Este crédito aún no tiene un monto</h2>
          <p>Completa sus condiciones desde el panel principal.</p>
          <Link href="/">Configurar este crédito</Link>
        </section>
      ) : (
        <>
          <div className="loan-progress credit-progress">
            <section className="loan-snapshot loan-start">
              <span className="snapshot-label">ASÍ EMPEZAMOS</span>
              <div className="snapshot-values">
                <div>
                  <p>Total a devolver</p>
                  <strong>{money.format(finance.activeCreditTotals.repayment)}</strong>
                </div>
                <div>
                  <p>Costo del préstamo</p>
                  <strong>{money.format(finance.activeCreditTotals.cost)}</strong>
                </div>
              </div>
            </section>

            <section className="loan-snapshot loan-current">
              <div className="snapshot-head">
                <span className="snapshot-label">ASÍ VAMOS</span>
                <small>{finance.activeCreditTotals.paymentProgress.toFixed(0)}% pagado</small>
              </div>
              <div className="snapshot-values">
                <div>
                  <p>Saldo pendiente</p>
                  <strong>{money.format(finance.activeCreditTotals.remainingRepayment)}</strong>
                </div>
                <div>
                  <p>Total pagado</p>
                  <strong className="paid-value">
                    {money.format(finance.activeCreditTotals.paidAmount)}
                  </strong>
                </div>
              </div>
              <div className="loan-progress-bar" aria-hidden="true">
                <i
                  style={{
                    width: `${Math.min(100, finance.activeCreditTotals.paymentProgress)}%`,
                  }}
                />
              </div>
              <small className="installments-left">
                {finance.activeCreditTotals.remainingInstallments} cuotas pendientes
              </small>
            </section>
          </div>

          <section className="payment-calendar credit-calendar">
            <div className="calendar-head">
              <div className="calendar-title">
                <span>PLAN DE PAGOS</span>
                <h2>Calendario de cuotas</h2>
                <p>Una cuota mensual desde la fecha que elegiste</p>
              </div>
              <span className="calendar-count">
                {finance.paymentSchedule.length}
                <small>cuotas</small>
              </span>
            </div>

            {allPaymentsPaid ? (
              <div className="first-payment payment-complete">
                <div>
                  <span>PRÉSTAMO AL DÍA</span>
                  <time>Todas las cuotas están pagadas</time>
                </div>
                <strong>{money.format(0)}</strong>
              </div>
            ) : nextPayment ? (
              <div
                className={`first-payment${nextDueStatus ? ` due-${nextDueStatus.tone}` : ""}`}
              >
                <div>
                  <span>PRÓXIMA CUOTA · N.º {nextPayment.number}</span>
                  <time dateTime={nextPayment.date.toISOString()}>
                    {paymentDate.format(nextPayment.date)}
                  </time>
                </div>
                <div className="next-payment-status">
                  <strong>{money.format(nextPayment.amount)}</strong>
                  {nextDueStatus && (
                    <span className={`due-badge due-${nextDueStatus.tone}`}>
                      <i />
                      {nextDueStatus.label}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="schedule-missing">
                Completa la fecha, el número y el valor de las cuotas desde el
                panel principal.
              </div>
            )}

            {finance.paymentSchedule.length > 0 && (
              <>
                <div
                  className="payment-view-selectors"
                  role="tablist"
                  aria-label="Estado de las cuotas"
                >
                  <button
                    id="pending-payments-tab"
                    type="button"
                    role="tab"
                    aria-selected={paymentView === "pending"}
                    aria-controls="payment-list-panel"
                    className={paymentView === "pending" ? "active" : ""}
                    onClick={() => {
                      setPaymentView("pending");
                      setShowAllPayments(false);
                    }}
                  >
                    <span>Cuotas pendientes</span>
                    <strong>{pendingPayments.length}</strong>
                  </button>
                  <button
                    id="paid-payments-tab"
                    type="button"
                    role="tab"
                    aria-selected={paymentView === "paid"}
                    aria-controls="payment-list-panel"
                    className={paymentView === "paid" ? "active" : ""}
                    onClick={() => {
                      setPaymentView("paid");
                      setShowAllPayments(false);
                    }}
                  >
                    <span>Cuotas pagadas</span>
                    <strong>{paidPayments.length}</strong>
                  </button>
                </div>

                {paymentView === "pending" && (
                  <div className="due-legend" aria-label="Indicadores de vencimiento">
                    <span><i className="green" />Más de 20 días</span>
                    <span><i className="orange" />13 a 20 días</span>
                    <span><i className="red" />12 días o menos</span>
                  </div>
                )}

                <div
                  id="payment-list-panel"
                  className="payment-list"
                  role="tabpanel"
                  aria-labelledby={`${paymentView}-payments-tab`}
                >
                  {visiblePayments.length === 0 && (
                    <div className="payment-list-empty">
                      {paymentView === "pending"
                        ? "No hay cuotas pendientes"
                        : "Todavía no hay cuotas pagadas"}
                    </div>
                  )}
                  {visiblePayments.map((installment) => {
                    const isPaid = paidPaymentNumbers.has(installment.number);
                    const dueStatus =
                      today && !isPaid
                        ? getDueStatus(daysUntilPayment(installment.date, today))
                        : null;

                    return (
                      <div
                        className={`payment-row${isPaid ? " is-paid" : dueStatus ? ` due-${dueStatus.tone}` : ""}`}
                        key={installment.number}
                      >
                        <span className="payment-number">
                          {installment.number}
                        </span>
                        <div className="payment-date">
                          <span>Cuota {installment.number}</span>
                          <time dateTime={installment.date.toISOString()}>
                            {paymentDate.format(installment.date)}
                          </time>
                          {isPaid ? (
                            <small className="row-due-status paid">Pagada</small>
                          ) : dueStatus ? (
                            <small
                              className={`row-due-status due-${dueStatus.tone}`}
                            >
                              {dueStatus.label}
                            </small>
                          ) : null}
                        </div>
                        <div className="payment-row-actions">
                          <strong>{money.format(installment.amount)}</strong>
                          <button
                            type="button"
                            className={`payment-paid-button${isPaid ? " is-paid" : ""}`}
                            aria-pressed={isPaid}
                            onClick={() =>
                              finance.toggleInstallmentPaid(installment.number)
                            }
                          >
                            {isPaid ? "Pagada ✓" : "Pagado"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedPayments.length > VISIBLE_PAYMENT_LIMIT && (
                  <button
                    className="calendar-toggle"
                    type="button"
                    aria-expanded={showAllPayments}
                    onClick={() =>
                      setShowAllPayments((current) => !current)
                    }
                  >
                    {showAllPayments ? "Ver menos" : "Ver más"}
                  </button>
                )}
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
