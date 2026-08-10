import { useEffect, useState } from "react";
import type {
  AdditionalCost,
  CapitalSource,
  Credit,
  Currency,
  Investment,
  InvestmentDraft,
  InvestmentValues,
} from "../finance/types";
import {
  formatInvestmentAmount,
  getAdditionalCostsTotal,
  money,
} from "../finance/format";
import { InvestmentGroup } from "./investment-group";

const capitalSourceLabels: Record<CapitalSource, string> = {
  loan: "Préstamo",
  card: "Tarjeta",
  savings: "Ahorros",
  person: "Persona",
};

type InvestmentsPanelProps = {
  credits: Credit[];
  activeCreditId: string | null;
  investments: Investment[];
  open: Investment[];
  closed: Investment[];
  available: number;
  draft: InvestmentDraft;
  onDraftChange: <K extends keyof InvestmentDraft>(
    field: K,
    value: InvestmentDraft[K],
  ) => void;
  onAdd: () => Promise<boolean>;
  onClose: (id: string) => Promise<boolean>;
  onReopen: (id: string) => Promise<boolean>;
  onEdit: (id: string, values: InvestmentValues) => Promise<boolean>;
  onRemove: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<boolean>;
};

export function InvestmentsPanel({
  credits,
  activeCreditId,
  investments,
  open,
  closed,
  available,
  draft,
  onDraftChange,
  onAdd,
  onClose,
  onReopen,
  onEdit,
  onRemove,
  onDuplicate,
}: InvestmentsPanelProps) {
  const [popupMessage, setPopupMessage] = useState("");
  const [additionalName, setAdditionalName] = useState("");
  const [additionalAmount, setAdditionalAmount] = useState("");
  const [additionalCurrency, setAdditionalCurrency] =
    useState<Currency>("PEN");
  const [additionalExchangeRate, setAdditionalExchangeRate] = useState("");
  const [additionalCapitalSource, setAdditionalCapitalSource] =
    useState<CapitalSource>("loan");
  const [additionalCreditId, setAdditionalCreditId] =
    useState(activeCreditId ?? "");

  useEffect(() => {
    if (!popupMessage) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPopupMessage("");
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [popupMessage]);

  async function submitInvestment(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(draft.amount);
    const salePricePen = Number(draft.salePricePen);
    const exchangeRate =
      draft.currency === "USD" ? Number(draft.exchangeRate) : 1;
    if (
      !draft.name.trim() ||
      amount <= 0 ||
      salePricePen <= 0 ||
      exchangeRate <= 0
    ) {
      setPopupMessage("Completa correctamente los datos de la inversión.");
      return;
    }

    const added = await onAdd();
    if (!added) {
      setPopupMessage(
        `No se puede usar más capital del préstamo. Disponible: ${money.format(available)}.`,
      );
    }
  }

  function addAdditionalCost() {
    const amount = Number(additionalAmount);
    const exchangeRate =
      additionalCurrency === "USD" ? Number(additionalExchangeRate) : 1;
    if (!additionalName.trim() || amount <= 0 || exchangeRate <= 0) return;

    const additionalCost: AdditionalCost = {
      id: null,
      name: additionalName.trim(),
      amount,
      currency: additionalCurrency,
      exchangeRate,
      capitalSource: additionalCapitalSource,
      creditId:
        additionalCapitalSource === "loan" ? additionalCreditId : undefined,
    };
    onDraftChange("additionalCosts", [
      ...draft.additionalCosts,
      additionalCost,
    ]);
    setAdditionalName("");
    setAdditionalAmount("");
    setAdditionalExchangeRate("");
  }

  function removeAdditionalCost(index: number) {
    onDraftChange(
      "additionalCosts",
      draft.additionalCosts.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  return (
    <section className="panel investments">
      <div className="section-head">
        <div>
          <p className="eyebrow">02 · INVERSIONES</p>
          <h2>Destino del capital</h2>
        </div>
        <span className="count">{investments.length}</span>
      </div>

      <form onSubmit={submitInvestment}>
        <input
          aria-label="Nombre de inversión"
          placeholder="Nombre de la inversión"
          value={draft.name}
          onChange={(event) => onDraftChange("name", event.target.value)}
        />

        <label className="capital-source-field">
          Origen del capital
          <select
            value={draft.capitalSource}
            onChange={(event) =>
              {
                const capitalSource = event.target.value as CapitalSource;
                onDraftChange("capitalSource", capitalSource);
                if (capitalSource === "loan" && !draft.creditId && activeCreditId) {
                  onDraftChange("creditId", activeCreditId);
                }
              }
            }
          >
            <option value="loan">Préstamo</option>
            <option value="card">Tarjeta</option>
            <option value="savings">Ahorros</option>
            <option value="person">Persona</option>
          </select>
          {draft.capitalSource === "loan" && (
            <select
              aria-label="Crédito que financia la inversión"
              value={draft.creditId ?? activeCreditId ?? ""}
              onChange={(event) =>
                onDraftChange("creditId", event.target.value)
              }
            >
              {credits.map((credit) => (
                <option key={credit.id} value={credit.id}>
                  {credit.name} · {money.format(credit.loan)}
                </option>
              ))}
            </select>
          )}
          <small>
            {draft.capitalSource === "loan"
              ? `El monto base se descontará del préstamo. Disponible: ${money.format(available)}.`
              : "El monto base no modifica el préstamo. Cada adicional usa su propio origen."}
          </small>
        </label>

        <div className="currency-row">
          <label>
            Moneda de la inversión
            <select
              value={draft.currency}
              onChange={(event) =>
                onDraftChange("currency", event.target.value as "PEN" | "USD")
              }
            >
              <option value="PEN">Soles (S/)</option>
              <option value="USD">Dólares (US$)</option>
            </select>
          </label>
          {draft.currency === "USD" && (
            <label>
              Costo del dólar en la transacción
              <input
                type="number"
                min="0.01"
                step="0.001"
                placeholder="Ej. 3.75"
                value={draft.exchangeRate}
                onChange={(event) =>
                  onDraftChange("exchangeRate", event.target.value)
                }
              />
            </label>
          )}
        </div>

        <section className="additional-costs-builder">
          <div className="additional-costs-head">
            <div>
              <strong>Adicionales</strong>
              <small>Se suman al costo real de la inversión</small>
            </div>
            <span>{money.format(getAdditionalCostsTotal(draft.additionalCosts))}</span>
          </div>
          <div className="additional-costs-inputs">
            <input
              aria-label="Concepto adicional"
              placeholder="Ej. envío, comisión o reparación"
              value={additionalName}
              onChange={(event) => setAdditionalName(event.target.value)}
            />
            <input
              aria-label="Monto adicional"
              type="number"
              min="0.01"
              step="0.01"
              placeholder={`Monto ${additionalCurrency === "USD" ? "US$" : "S/"}`}
              value={additionalAmount}
              onChange={(event) => setAdditionalAmount(event.target.value)}
            />
          </div>
          <div className="additional-costs-options">
            <label>
              Origen
              <select
                value={additionalCapitalSource}
                onChange={(event) =>
                  setAdditionalCapitalSource(
                    event.target.value as CapitalSource,
                  )
                }
              >
                <option value="loan">Préstamo</option>
                <option value="card">Tarjeta</option>
                <option value="savings">Ahorros</option>
                <option value="person">Persona</option>
              </select>
            </label>
            {additionalCapitalSource === "loan" && (
              <label>
                Crédito
                <select
                  value={additionalCreditId}
                  onChange={(event) =>
                    setAdditionalCreditId(event.target.value)
                  }
                >
                  {credits.map((credit) => (
                    <option key={credit.id} value={credit.id}>
                      {credit.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Moneda
              <select
                value={additionalCurrency}
                onChange={(event) =>
                  setAdditionalCurrency(event.target.value as Currency)
                }
              >
                <option value="PEN">Soles (S/)</option>
                <option value="USD">Dólares (US$)</option>
              </select>
            </label>
            {additionalCurrency === "USD" && (
              <label>
                Tipo de cambio
                <input
                  type="number"
                  min="0.01"
                  step="0.001"
                  placeholder="Ej. 3.75"
                  value={additionalExchangeRate}
                  onChange={(event) =>
                    setAdditionalExchangeRate(event.target.value)
                  }
                />
              </label>
            )}
            <button type="button" onClick={addAdditionalCost}>
              Añadir
            </button>
          </div>
          {draft.additionalCosts.length > 0 && (
            <div className="additional-costs-list">
              {draft.additionalCosts.map((item, index) => (
                <span key={`${item.name}-${index}`}>
                  {item.name} · {formatInvestmentAmount(item.amount, item.currency)} · {capitalSourceLabels[item.capitalSource]}
                  {item.capitalSource === "loan" && item.creditId &&
                    ` (${credits.find((credit) => credit.id === item.creditId)?.name ?? "Crédito eliminado"})`}
                  {item.currency === "USD" && ` · TC ${item.exchangeRate.toFixed(3)}`}
                  <button
                    type="button"
                    aria-label={`Eliminar adicional ${item.name}`}
                    onClick={() => removeAdditionalCost(index)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        <div className="form-row">
          <input
            aria-label="Monto invertido"
            type="number"
            min="0.01"
            step="0.01"
            placeholder={`Monto ${draft.currency === "USD" ? "US$" : "S/"}`}
            value={draft.amount}
            onChange={(event) => onDraftChange("amount", event.target.value)}
          />
          <input
            aria-label="Precio proyectado de venta"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Precio proyectado S/"
            value={draft.salePricePen}
            onChange={(event) =>
              onDraftChange("salePricePen", event.target.value)
            }
          />
          <button type="submit">Agregar abierta</button>
        </div>
      </form>

      <div className="investment-groups">
        <InvestmentGroup
          title="Abiertas"
          subtitle="Prospección"
          items={open}
          empty="No hay inversiones abiertas"
          action="Cerrar"
          onAction={onClose}
          onEdit={onEdit}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
          available={available}
          credits={credits}
          onError={setPopupMessage}
        />
        <InvestmentGroup
          title="Cerradas"
          subtitle="Balance actual"
          items={closed}
          empty="No hay inversiones cerradas"
          action="Reabrir"
          onAction={onReopen}
          onEdit={onEdit}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
          available={available}
          credits={credits}
          onError={setPopupMessage}
        />
      </div>

      {popupMessage && (
        <div
          className="finance-popup-overlay"
          role="presentation"
          onMouseDown={() => setPopupMessage("")}
        >
          <section
            className="finance-popup"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="finance-popup-title"
            aria-describedby="finance-popup-message"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="finance-popup-icon" aria-hidden="true">
              !
            </span>
            <div className="finance-popup-copy">
              <p className="eyebrow">AVISO</p>
              <h3 id="finance-popup-title">Revisa esta operación</h3>
              <p id="finance-popup-message">{popupMessage}</p>
            </div>
            <button
              type="button"
              autoFocus
              onClick={() => setPopupMessage("")}
            >
              Entendido
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
