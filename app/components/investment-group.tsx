import { useState } from "react";
import {
  formatInvestmentAmount,
  getAdditionalCostsTotal,
  getInvestmentCostInSoles,
  money,
} from "../finance/format";
import { EMPTY_DRAFT } from "../finance/use-finance-dashboard";
import type {
  AdditionalCost,
  CapitalSource,
  Credit,
  Currency,
  Investment,
  InvestmentValues,
} from "../finance/types";

const capitalSourceLabels: Record<CapitalSource, string> = {
  loan: "Préstamo",
  card: "Tarjeta",
  savings: "Ahorros",
  person: "Persona",
};

type InvestmentGroupProps = {
  title: string;
  subtitle: string;
  items: Investment[];
  empty: string;
  action: string;
  available: number;
  onAction: (id: number) => boolean;
  onEdit: (id: number, values: InvestmentValues) => boolean;
  onRemove: (id: number) => void;
  onDuplicate: (id: number) => boolean;
  onError: (message: string) => void;
  credits: Credit[];
};

export function InvestmentGroup({
  title,
  subtitle,
  items,
  empty,
  action,
  available,
  onAction,
  onEdit,
  onRemove,
  onDuplicate,
  onError,
  credits,
}: InvestmentGroupProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState(EMPTY_DRAFT);
  const [editAdditionalName, setEditAdditionalName] = useState("");
  const [editAdditionalAmount, setEditAdditionalAmount] = useState("");
  const [editAdditionalCurrency, setEditAdditionalCurrency] =
    useState<Currency>("PEN");
  const [editAdditionalExchangeRate, setEditAdditionalExchangeRate] =
    useState("");
  const [editAdditionalCapitalSource, setEditAdditionalCapitalSource] =
    useState<CapitalSource>("loan");
  const [editAdditionalCreditId, setEditAdditionalCreditId] = useState(
    credits[0]?.id ?? 0,
  );

  function beginEdit(item: Investment) {
    const validItemCreditId = credits.some(
      (credit) => credit.id === item.creditId,
    )
      ? (item.creditId as number)
      : (credits[0]?.id ?? 0);

    setEditingId(item.id);
    setEditAdditionalName("");
    setEditAdditionalAmount("");
    setEditAdditionalCurrency("PEN");
    setEditAdditionalExchangeRate("");
    setEditAdditionalCapitalSource(item.capitalSource);
    setEditAdditionalCreditId(validItemCreditId);
    setEditDraft({
      name: item.name,
      amount: String(item.amount),
      salePricePen: String(item.salePricePen),
      currency: item.currency,
      exchangeRate: item.currency === "USD" ? String(item.exchangeRate) : "",
      capitalSource: item.capitalSource,
      creditId:
        item.capitalSource === "loan" ? validItemCreditId : null,
      additionalCosts: item.additionalCosts,
    });
  }

  function saveEdit(event: React.SubmitEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const amount = Number(editDraft.amount);
    const salePricePen = Number(editDraft.salePricePen);
    const exchangeRate =
      editDraft.currency === "USD" ? Number(editDraft.exchangeRate) : 1;

    if (
      !editDraft.name.trim() ||
      amount <= 0 ||
      salePricePen <= 0 ||
      exchangeRate <= 0
    ) {
      return;
    }

    const saved = onEdit(id, {
      name: editDraft.name.trim(),
      amount,
      salePricePen,
      currency: editDraft.currency,
      exchangeRate,
      capitalSource: editDraft.capitalSource,
      creditId:
        editDraft.capitalSource === "loan"
          ? (editDraft.creditId ?? credits[0]?.id)
          : undefined,
      additionalCosts: editDraft.additionalCosts,
    });
    if (!saved) {
      onError(
        `El costo supera el capital disponible de ${money.format(available)}.`,
      );
      return;
    }

    setEditingId(null);
  }

  function duplicate(id: number) {
    const duplicated = onDuplicate(id);
    if (!duplicated) {
      onError(
        `No se puede duplicar: solo hay ${money.format(available)} disponibles.`,
      );
    }
  }

  function changeInvestmentStatus(id: number) {
    const changed = onAction(id);
    if (!changed) {
      onError(
        `No se puede reabrir: solo hay ${money.format(available)} disponibles.`,
      );
    }
  }

  function addEditAdditionalCost() {
    const amount = Number(editAdditionalAmount);
    const exchangeRate =
      editAdditionalCurrency === "USD"
        ? Number(editAdditionalExchangeRate)
        : 1;
    if (!editAdditionalName.trim() || amount <= 0 || exchangeRate <= 0) return;

    const additionalCost: AdditionalCost = {
      id: Date.now(),
      name: editAdditionalName.trim(),
      amount,
      currency: editAdditionalCurrency,
      exchangeRate,
      capitalSource: editAdditionalCapitalSource,
      creditId:
        editAdditionalCapitalSource === "loan"
          ? editAdditionalCreditId
          : undefined,
    };
    setEditDraft({
      ...editDraft,
      additionalCosts: [...editDraft.additionalCosts, additionalCost],
    });
    setEditAdditionalName("");
    setEditAdditionalAmount("");
    setEditAdditionalExchangeRate("");
  }

  function removeEditAdditionalCost(id: number) {
    setEditDraft({
      ...editDraft,
      additionalCosts: editDraft.additionalCosts.filter(
        (item) => item.id !== id,
      ),
    });
  }

  return (
    <section className="investment-group">
      <div className="group-head">
        <div>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </div>
        <span>{items.length}</span>
      </div>

      <div className="list">
        {items.length === 0 && <p className="empty">{empty}</p>}
        {items.map((item) => {
          const additionalTotal = getAdditionalCostsTotal(item.additionalCosts);
          const totalCostInSoles = getInvestmentCostInSoles(item);
          const baseCapitalInSoles = totalCostInSoles - additionalTotal;
          const gainInSoles = item.salePricePen - totalCostInSoles;
          const returnPercentage = totalCostInSoles
            ? (gainInSoles / totalCostInSoles) * 100
            : 0;

          return (
            <article key={item.id}>
              <button
                type="button"
                className="remove"
                aria-label={`Eliminar ${item.name}`}
                onClick={() => onRemove(item.id)}
              >
                ×
              </button>

              {editingId === item.id ? (
                <form
                  className="investment-edit"
                  onSubmit={(event) => saveEdit(event, item.id)}
                >
                  <label>
                    Nombre
                    <input
                      value={editDraft.name}
                      onChange={(event) =>
                        setEditDraft({ ...editDraft, name: event.target.value })
                      }
                    />
                  </label>
                  {editDraft.capitalSource === "loan" && (
                    <label className="edit-source-field">
                      Crédito que financia
                      <select
                        value={editDraft.creditId ?? credits[0]?.id}
                        onChange={(event) =>
                          setEditDraft({
                            ...editDraft,
                            creditId: Number(event.target.value),
                          })
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
                  <label className="edit-source-field">
                    Origen del capital
                    <select
                      value={editDraft.capitalSource}
                      onChange={(event) =>
                        setEditDraft({
                          ...editDraft,
                          capitalSource: event.target.value as CapitalSource,
                        })
                      }
                    >
                      <option value="loan">Préstamo</option>
                      <option value="card">Tarjeta</option>
                      <option value="savings">Ahorros</option>
                      <option value="person">Persona</option>
                    </select>
                  </label>
                  <div className="edit-currency-row">
                    <label>
                      Moneda
                      <select
                        value={editDraft.currency}
                        onChange={(event) =>
                          setEditDraft({
                            ...editDraft,
                            currency: event.target.value as Currency,
                          })
                        }
                      >
                        <option value="PEN">Soles (S/)</option>
                        <option value="USD">Dólares (US$)</option>
                      </select>
                    </label>
                    {editDraft.currency === "USD" && (
                      <label>
                        Costo del dólar
                        <input
                          type="number"
                          min="0.01"
                          step="0.001"
                          value={editDraft.exchangeRate}
                          onChange={(event) =>
                            setEditDraft({
                              ...editDraft,
                              exchangeRate: event.target.value,
                            })
                          }
                        />
                      </label>
                    )}
                  </div>
                  <section className="edit-additional-costs">
                    <div className="additional-costs-head">
                      <div>
                        <strong>Adicionales</strong>
                        <small>Los montos se convierten a soles</small>
                      </div>
                      <span>
                        {money.format(
                          getAdditionalCostsTotal(editDraft.additionalCosts),
                        )}
                      </span>
                    </div>
                    <div className="additional-costs-inputs">
                      <input
                        aria-label="Concepto adicional"
                        placeholder="Concepto"
                        value={editAdditionalName}
                        onChange={(event) =>
                          setEditAdditionalName(event.target.value)
                        }
                      />
                      <input
                        aria-label="Monto adicional"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder={`Monto ${editAdditionalCurrency === "USD" ? "US$" : "S/"}`}
                        value={editAdditionalAmount}
                        onChange={(event) =>
                          setEditAdditionalAmount(event.target.value)
                        }
                      />
                    </div>
                    <div className="additional-costs-options">
                      <label>
                        Origen
                        <select
                          value={editAdditionalCapitalSource}
                          onChange={(event) =>
                            setEditAdditionalCapitalSource(
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
                      {editAdditionalCapitalSource === "loan" && (
                        <label>
                          Crédito
                          <select
                            value={editAdditionalCreditId}
                            onChange={(event) =>
                              setEditAdditionalCreditId(
                                Number(event.target.value),
                              )
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
                          value={editAdditionalCurrency}
                          onChange={(event) =>
                            setEditAdditionalCurrency(
                              event.target.value as Currency,
                            )
                          }
                        >
                          <option value="PEN">Soles (S/)</option>
                          <option value="USD">Dólares (US$)</option>
                        </select>
                      </label>
                      {editAdditionalCurrency === "USD" && (
                        <label>
                          Tipo de cambio
                          <input
                            type="number"
                            min="0.01"
                            step="0.001"
                            placeholder="Ej. 3.75"
                            value={editAdditionalExchangeRate}
                            onChange={(event) =>
                              setEditAdditionalExchangeRate(event.target.value)
                            }
                          />
                        </label>
                      )}
                      <button type="button" onClick={addEditAdditionalCost}>
                        Añadir
                      </button>
                    </div>
                    {editDraft.additionalCosts.length > 0 && (
                      <div className="additional-costs-list">
                        {editDraft.additionalCosts.map((additional) => (
                          <span key={additional.id}>
                            {additional.name} · {formatInvestmentAmount(additional.amount, additional.currency)} · {capitalSourceLabels[additional.capitalSource]}
                            {additional.capitalSource === "loan" && additional.creditId &&
                              ` (${credits.find((credit) => credit.id === additional.creditId)?.name ?? "Crédito eliminado"})`}
                            {additional.currency === "USD" && ` · TC ${additional.exchangeRate.toFixed(3)}`}
                            <button
                              type="button"
                              aria-label={`Eliminar adicional ${additional.name}`}
                              onClick={() =>
                                removeEditAdditionalCost(additional.id)
                              }
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </section>
                  <div>
                    <label>
                      Capital
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={editDraft.amount}
                        onChange={(event) =>
                          setEditDraft({
                            ...editDraft,
                            amount: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Precio proyectado en soles
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={editDraft.salePricePen}
                        onChange={(event) =>
                          setEditDraft({
                            ...editDraft,
                            salePricePen: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="edit-actions">
                    <button type="button" onClick={() => setEditingId(null)}>
                      Cancelar
                    </button>
                    <button type="submit">Guardar</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="investment-name">
                    <span>{item.name.charAt(0).toUpperCase()}</span>
                    <div>
                      <strong>{item.name}</strong>
                      <small
                        className={`source-badge source-${item.capitalSource}`}
                      >
                        {capitalSourceLabels[item.capitalSource]}
                      </small>
                      {item.capitalSource === "loan" && (
                        <small className="funding-credit">
                          {credits.find((credit) => credit.id === item.creditId)?.name ??
                            "Crédito eliminado"}
                        </small>
                      )}
                      <small>
                        Capital: {formatInvestmentAmount(item.amount, item.currency)}
                      </small>
                      {item.currency === "USD" && (
                        <small>
                          {money.format(baseCapitalInSoles)} · dólar a S/{" "}
                          {item.exchangeRate.toFixed(3)}
                        </small>
                      )}
                      {additionalTotal > 0 && (
                        <small className="additional-summary">
                          Adicionales: {money.format(additionalTotal)}
                        </small>
                      )}
                      <small>Costo total: {money.format(totalCostInSoles)}</small>
                    </div>
                  </div>
                  <div className="investment-side">
                    <div className="return">
                      <strong>
                        {money.format(item.salePricePen)}
                      </strong>
                      <small className="projected-gain">
                        Ganancia estimada: {gainInSoles >= 0 ? "+" : ""}
                        {money.format(gainInSoles)}
                      </small>
                      <small>
                        Precio proyectado · {returnPercentage.toFixed(1)}% retorno
                      </small>
                    </div>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="duplicate-action"
                        onClick={() => duplicate(item.id)}
                      >
                        Duplicar
                      </button>
                      <button
                        type="button"
                        className="edit-action"
                        onClick={() => beginEdit(item)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="state-action"
                        onClick={() => changeInvestmentStatus(item.id)}
                      >
                        {action}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
