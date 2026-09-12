import { money } from "../finance/format";

type SummaryProps = {
  remainingLoan: number;
  months: number;
  paidInstallments: number;
  totalInstallments: number;
  creditCount: number;
  available: number;
  availablePercentage: number;
  projectedProfit: number;
  expectedReturn: number;
  currentBalance: number;
  openCount: number;
  closedCount: number;
};

export function Summary({
  remainingLoan,
  months,
  paidInstallments,
  totalInstallments,
  creditCount,
  available,
  availablePercentage,
  projectedProfit,
  expectedReturn,
  currentBalance,
  openCount,
  closedCount,
}: SummaryProps) {
  const formatGain = (value: number) =>
    `${value > 0 ? "+" : ""}${money.format(value)}`;

  return (
    <section className="summary">
      <article>
        <p>Saldo de créditos</p>
        <strong>{money.format(remainingLoan)}</strong>
        <small>
          {creditCount > 1
            ? `${creditCount} créditos activos · ${Math.max(0, totalInstallments - paidInstallments)} cuotas pendientes`
            : paidInstallments > 0
            ? `${paidInstallments} pagadas · ${Math.max(0, totalInstallments - paidInstallments)} pendientes`
            : months
              ? `${months} meses de plazo`
              : "Plazo pendiente"}
        </small>
      </article>
      <article className="dark">
        <p>Capital disponible</p>
        <strong>{money.format(available)}</strong>
        <small>
          {availablePercentage.toFixed(0)}% sin asignar
          {currentBalance > 0 && " · incluye ganancias cerradas"}
        </small>
      </article>
      <article>
        <p>Ganancia potencial</p>
        <strong className={projectedProfit >= 0 ? "green" : "negative"}>
          {formatGain(projectedProfit)}
        </strong>
        <small>
          {openCount} {openCount === 1 ? "operación abierta" : "operaciones abiertas"}
          {` · ${expectedReturn.toFixed(1)}% de retorno esperado`}
        </small>
      </article>
      <article>
        <p>Ganancia realizada</p>
        <strong className={currentBalance >= 0 ? "green" : "negative"}>
          {formatGain(currentBalance)}
        </strong>
        <small>
          {closedCount} {closedCount === 1 ? "operación cerrada" : "operaciones cerradas"}
        </small>
      </article>
    </section>
  );
}
