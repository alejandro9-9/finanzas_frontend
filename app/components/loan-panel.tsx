"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { money } from "../finance/format";
import type { Credit, CreditChanges } from "../finance/types";

type LoanPanelProps = {
  credits: Credit[];
  activeCreditId: number;
  remainingRepayment: number;
  remainingInstallments: number;
  creditCommitments: Record<number, number>;
  onSelectCredit: (id: number) => void;
  onAddCredit: () => Credit;
  onRemoveCredit: (
    id: number,
  ) => "deleted" | "has-open-investments";
  onSaveCredit: (id: number, changes: CreditChanges) => boolean;
};

function getEditableValues(credit: Credit): CreditChanges {
  return {
    name: credit.name,
    loan: credit.loan,
    months: credit.months,
    installments: credit.installments,
    payment: credit.payment,
    firstPaymentDate: credit.firstPaymentDate,
  };
}

export function LoanPanel({
  credits,
  activeCreditId,
  remainingRepayment,
  remainingInstallments,
  creditCommitments,
  onSelectCredit,
  onAddCredit,
  onRemoveCredit,
  onSaveCredit,
}: LoanPanelProps) {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [editingCreditId, setEditingCreditId] = useState<number | null>(null);
  const [newCreditId, setNewCreditId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<CreditChanges | null>(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [creditToDelete, setCreditToDelete] = useState<Credit | null>(null);
  const activeCredit =
    credits.find((credit) => credit.id === activeCreditId) ?? credits[0];
  const isEditing =
    editingCreditId === activeCredit.id && editDraft !== null;
  const displayedCredit = isEditing ? editDraft : getEditableValues(activeCredit);
  const creditPaid =
    activeCredit.installments > 0 && remainingInstallments === 0;
  const creditCount = credits.filter((credit) => credit.loan > 0).length;
  const showEmptyState = creditCount === 0 && !isEditing;

  useEffect(() => {
    if (!popupMessage && !creditToDelete) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPopupMessage("");
        setCreditToDelete(null);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [creditToDelete, popupMessage]);

  function selectCredit(id: number) {
    if (
      editingCreditId !== null &&
      newCreditId === editingCreditId &&
      editingCreditId !== id
    ) {
      onRemoveCredit(editingCreditId);
      setNewCreditId(null);
    }
    setEditingCreditId(null);
    setEditDraft(null);
    onSelectCredit(id);
  }

  function beginEdit(credit: Credit) {
    if (
      editingCreditId !== null &&
      newCreditId === editingCreditId &&
      editingCreditId !== credit.id
    ) {
      onRemoveCredit(editingCreditId);
      setNewCreditId(null);
    }
    onSelectCredit(credit.id);
    setEditingCreditId(credit.id);
    setEditDraft(getEditableValues(credit));
    window.requestAnimationFrame(() => nameInputRef.current?.focus());
  }

  function createCredit() {
    if (newCreditId === editingCreditId && editingCreditId !== null) {
      onRemoveCredit(editingCreditId);
    }
    const newCredit = onAddCredit();
    setNewCreditId(newCredit.id);
    setEditingCreditId(newCredit.id);
    setEditDraft(getEditableValues(newCredit));
    window.requestAnimationFrame(() => nameInputRef.current?.focus());
  }

  function cancelEditing() {
    if (newCreditId === editingCreditId && editingCreditId !== null) {
      onRemoveCredit(editingCreditId);
      setNewCreditId(null);
    }
    setEditingCreditId(null);
    setEditDraft(null);
  }

  function saveChanges() {
    if (!editDraft) return;
    const saved = onSaveCredit(activeCredit.id, editDraft);
    if (!saved) {
      const committedCapital = creditCommitments[activeCredit.id] ?? 0;
      setPopupMessage(
        `El monto no puede ser menor que ${money.format(committedCapital)}, porque ese capital está siendo usado en inversiones abiertas.`,
      );
      return;
    }
    setNewCreditId(null);
    setEditingCreditId(null);
    setEditDraft(null);
  }

  function requestCreditDeletion(credit: Credit) {
    const committedCapital = creditCommitments[credit.id] ?? 0;
    if (committedCapital > 0.005) {
      setPopupMessage(
        `No se puede eliminar ${credit.name}: tiene ${money.format(committedCapital)} en inversiones abiertas.`,
      );
      return;
    }
    setCreditToDelete(credit);
  }

  function confirmCreditDeletion() {
    if (!creditToDelete) return;
    const result = onRemoveCredit(creditToDelete.id);
    setCreditToDelete(null);
    if (newCreditId === creditToDelete.id) setNewCreditId(null);
    setEditingCreditId(null);
    setEditDraft(null);
    if (result === "has-open-investments") {
      setPopupMessage(
        "Este crédito todavía tiene inversiones abiertas y no puede eliminarse.",
      );
    }
  }

  function updateDraft<K extends keyof CreditChanges>(
    field: K,
    value: CreditChanges[K],
  ) {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, [field]: value });
  }

  return (
    <section className="panel loan-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">01 · PRÉSTAMO</p>
          <h2>Condiciones del crédito</h2>
        </div>
        <span className="pill">
          {creditCount === 0
            ? "Sin créditos"
            : `${creditCount} ${creditCount === 1 ? "crédito" : "créditos"}`}
        </span>
      </div>

      {showEmptyState && (
        <div className="loan-empty-state">
          <span className="loan-empty-icon" aria-hidden="true">+</span>
          <div>
            <h3>Aún no tienes préstamos registrados</h3>
            <p>Agrega tu primer préstamo para controlar sus cuotas y el capital disponible.</p>
          </div>
          <button type="button" onClick={() => beginEdit(activeCredit)}>
            Agregar préstamo
          </button>
        </div>
      )}

      {!showEmptyState && <div className="credit-manager">
        <div className="credit-manager-head">
          <span>Mis créditos</span>
          <button type="button" onClick={createCredit}>
            + Nuevo crédito
          </button>
        </div>
        <div className="credit-tabs" role="tablist" aria-label="Seleccionar crédito">
          {credits.map((credit) => (
            <div
              key={credit.id}
              className={`credit-tab-card${credit.id === activeCreditId ? " active" : ""}`}
            >
              <button
                className="credit-tab-select"
                type="button"
                role="tab"
                aria-selected={credit.id === activeCreditId}
                onClick={() => selectCredit(credit.id)}
              >
                <span>{credit.name}</span>
                <small>{money.format(credit.loan)}</small>
              </button>
              <span className="credit-tab-actions">
                <button
                  type="button"
                  title={`Editar ${credit.name}`}
                  aria-label={`Editar ${credit.name}`}
                  onClick={() => beginEdit(credit)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  title={`Eliminar ${credit.name}`}
                  aria-label={`Eliminar ${credit.name}`}
                  onClick={() => requestCreditDeletion(credit)}
                >
                  ×
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>}

      {!showEmptyState && <div className={`credit-fields${isEditing ? " is-editing" : " is-readonly"}`}>
        <label className="credit-name-field">
          Nombre del crédito
          <input
            ref={nameInputRef}
            value={displayedCredit.name}
            placeholder="Ej. Préstamo personal"
            disabled={!isEditing}
            onChange={(event) => updateDraft("name", event.target.value)}
          />
        </label>

        <div className="field full">
          <label htmlFor={`loan-${activeCreditId}`}>Monto recibido</label>
          <div className="money-input">
            <span>S/</span>
            <input
              id={`loan-${activeCreditId}`}
              type="number"
              min={creditCommitments[activeCreditId] ?? 0}
              placeholder="Ingresa el monto"
              value={displayedCredit.loan || ""}
              disabled={!isEditing}
              onChange={(event) =>
                updateDraft("loan", Number(event.target.value))
              }
            />
          </div>
        </div>

        <div className="fields">
          <label>
            Plazo del préstamo (meses)
            <input
              type="number"
              min="1"
              placeholder="Ej. 15"
              value={displayedCredit.months || ""}
              disabled={!isEditing}
              onChange={(event) =>
                updateDraft("months", Number(event.target.value))
              }
            />
          </label>
          <label>
            Número de cuotas
            <input
              type="number"
              min="1"
              placeholder="Ingresa las cuotas"
              value={displayedCredit.installments || ""}
              disabled={!isEditing}
              onChange={(event) =>
                updateDraft("installments", Number(event.target.value))
              }
            />
          </label>
          <label>
            Valor de cada cuota
            <div className="inline-money">
              <span>S/</span>
              <input
                type="number"
                min="0"
                placeholder="Ingresa el valor"
                value={displayedCredit.payment || ""}
                disabled={!isEditing}
                onChange={(event) =>
                  updateDraft("payment", Number(event.target.value))
                }
              />
            </div>
          </label>
          <label>
            Fecha de la primera cuota
            <input
              type="date"
              value={displayedCredit.firstPaymentDate}
              disabled={!isEditing}
              onChange={(event) =>
                updateDraft("firstPaymentDate", event.target.value)
              }
            />
          </label>
        </div>
      </div>}

      {isEditing && (
        <div className="credit-save-actions">
          <span>Los cambios se aplicarán cuando los guardes.</span>
          <div>
            <button type="button" onClick={cancelEditing}>Cancelar</button>
            <button type="button" onClick={saveChanges}>Guardar cambios</button>
          </div>
        </div>
      )}

      {activeCredit.loan > 0 && !isEditing && (
        <Link className="credit-details-trigger" href="/creditos">
          <span className="credit-trigger-icon">i</span>
          <span className="credit-trigger-copy">
            <strong>Más información sobre mi crédito</strong>
            <small>
              {creditPaid
                ? "Crédito completamente pagado"
                : `${money.format(remainingRepayment)} pendientes · ${remainingInstallments} cuotas`}
            </small>
          </span>
          <span className="credit-trigger-action">
            <strong>Ver detalle →</strong>
          </span>
        </Link>
      )}

      {(popupMessage || creditToDelete) && (
        <div
          className="finance-popup-overlay"
          role="presentation"
          onMouseDown={() => {
            setPopupMessage("");
            setCreditToDelete(null);
          }}
        >
          <section
            className="finance-popup"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="credit-popup-title"
            aria-describedby="credit-popup-message"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="finance-popup-icon" aria-hidden="true">!</span>
            <div className="finance-popup-copy">
              <p className="eyebrow">CRÉDITOS</p>
              <h3 id="credit-popup-title">
                {creditToDelete ? "¿Eliminar este crédito?" : "Operación no permitida"}
              </h3>
              <p id="credit-popup-message">
                {creditToDelete
                  ? `Se eliminarán los datos y pagos registrados de ${creditToDelete.name}.`
                  : popupMessage}
              </p>
            </div>
            <div className="finance-popup-actions">
              {creditToDelete && (
                <button type="button" onClick={() => setCreditToDelete(null)}>
                  Cancelar
                </button>
              )}
              <button
                type="button"
                autoFocus
                className={creditToDelete ? "danger" : "primary"}
                onClick={
                  creditToDelete
                    ? confirmCreditDeletion
                    : () => setPopupMessage("")
                }
              >
                {creditToDelete ? "Eliminar crédito" : "Entendido"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
