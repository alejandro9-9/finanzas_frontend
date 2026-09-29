"use client";

import { useEffect, useRef, useState } from "react";
import type { CreditChanges } from "../finance/types";

type CreditSaveResult = "saved" | "capital-conflict" | "failed";

type CreditCreateDialogProps = {
  onClose: () => void;
  onSave: (id: string | null, changes: CreditChanges) => Promise<CreditSaveResult>;
};

const EMPTY_CREDIT: CreditChanges = {
  name: "",
  loan: 0,
  months: 0,
  installments: 0,
  payment: 0,
  firstPaymentDate: "",
};

export function CreditCreateDialog({ onClose, onSave }: CreditCreateDialogProps) {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(EMPTY_CREDIT);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    nameInputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function updateDraft<K extends keyof CreditChanges>(
    field: K,
    value: CreditChanges[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function submit() {
    if (!draft.name.trim()) {
      setError("Ingresa un nombre para el crédito.");
      return;
    }
    if (draft.loan <= 0) {
      setError("El monto recibido debe ser mayor que cero.");
      return;
    }
    if (draft.installments <= 0) {
      setError("El número de cuotas debe ser mayor que cero.");
      return;
    }
    if (draft.payment <= 0) {
      setError("El valor de cada cuota debe ser mayor que cero.");
      return;
    }
    if (!draft.firstPaymentDate) {
      setError("Selecciona la fecha de la primera cuota.");
      return;
    }

    setIsSaving(true);
    const result = await onSave(null, draft);
    setIsSaving(false);
    if (result === "saved") {
      onClose();
    } else if (result === "capital-conflict") {
      setError("No se pudo asignar el monto del crédito al capital disponible.");
    } else {
      setError("No se pudo guardar el crédito. Revisa la conexión e inténtalo de nuevo.");
    }
  }

  return (
    <div
      className="finance-popup-overlay credit-create-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <section
        className="credit-create-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credit-create-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="credit-create-heading">
          <div>
            <p className="eyebrow">NUEVA OPERACIÓN</p>
            <h2 id="credit-create-title">Registrar crédito</h2>
            <p>Ingresa las condiciones para agregarlo a tu panel.</p>
          </div>
          <button
            className="credit-create-close"
            type="button"
            aria-label="Cerrar formulario de crédito"
            disabled={isSaving}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="credit-fields is-editing credit-create-fields">
          <label className="credit-name-field">
            Nombre del crédito
            <input
              ref={nameInputRef}
              value={draft.name}
              placeholder="Ej. Préstamo personal"
              onChange={(event) => updateDraft("name", event.target.value)}
            />
          </label>

          <div className="field full">
            <label htmlFor="new-credit-amount">Monto recibido</label>
            <div className="money-input">
              <span>S/</span>
              <input
                id="new-credit-amount"
                type="number"
                min="0"
                placeholder="Ingresa el monto"
                value={draft.loan || ""}
                onChange={(event) => updateDraft("loan", Number(event.target.value))}
              />
            </div>
          </div>

          <div className="fields">
            <label>
              Número de cuotas
              <input
                type="number"
                min="1"
                placeholder="Ingresa las cuotas"
                value={draft.installments || ""}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setDraft((current) => ({ ...current, installments: value, months: value }));
                  setError("");
                }}
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
                  value={draft.payment || ""}
                  onChange={(event) => updateDraft("payment", Number(event.target.value))}
                />
              </div>
            </label>
            <label>
              Fecha de la primera cuota
              <input
                type="date"
                value={draft.firstPaymentDate}
                onChange={(event) => updateDraft("firstPaymentDate", event.target.value)}
              />
            </label>
          </div>
          {error ? <p className="credit-create-error" role="alert">{error}</p> : null}
        </div>

        <div className="credit-save-actions credit-create-actions">
          <span>Los datos se guardarán en tu cuenta.</span>
          <div>
            <button type="button" disabled={isSaving} onClick={onClose}>
              Cancelar
            </button>
            <button type="button" disabled={isSaving} onClick={() => void submit()}>
              {isSaving ? "Guardando…" : "Guardar crédito"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
