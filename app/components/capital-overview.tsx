import Link from "next/link";
import { money } from "../finance/format";

type CapitalOverviewProps = {
  totalCapital: number;
  available: number;
  invested: number;
  projectedProfit: number;
  currentBalance: number;
  openCount: number;
  closedCount: number;
};

export function CapitalOverview({
  totalCapital,
  available,
  invested,
  projectedProfit,
  currentBalance,
  openCount,
  closedCount,
}: CapitalOverviewProps) {
  const usagePercentage =
    totalCapital > 0
      ? Math.min(100, Math.max(0, (invested / totalCapital) * 100))
      : 0;

  return (
    <section className="panel capital-overview">
      <div className="section-head">
        <div>
          <p className="eyebrow">02 · INVERSIONES</p>
          <h2>Destino del capital</h2>
        </div>
        <span className="count">{openCount + closedCount}</span>
      </div>

      <div className="capital-overview-main">
        <div
          className="capital-ring"
          role="img"
          aria-label={`${usagePercentage.toFixed(0)} por ciento del capital en uso`}
          style={{
            background: `conic-gradient(var(--lime) ${usagePercentage}%, #343730 ${usagePercentage}% 100%)`,
          }}
        >
          <div>
            <strong>{usagePercentage.toFixed(0)}%</strong>
            <span>en uso</span>
          </div>
        </div>

        <div className="capital-overview-copy">
          <span>Capital disponible</span>
          <strong>{money.format(available)}</strong>
          <p>
            {openCount > 0
              ? `${openCount} ${openCount === 1 ? "inversión activa" : "inversiones activas"}`
              : "Sin inversiones activas"}
          </p>
        </div>
      </div>

      <div className="capital-overview-stats">
        <article>
          <span>Capital trabajando</span>
          <strong>{money.format(invested)}</strong>
        </article>
        <article>
          <span>Ganancia proyectada</span>
          <strong className={projectedProfit >= 0 ? "positive" : "negative"}>
            {projectedProfit >= 0 ? "+" : ""}
            {money.format(projectedProfit)}
          </strong>
        </article>
        <article>
          <span>Ganancia realizada</span>
          <strong className={currentBalance >= 0 ? "positive" : "negative"}>
            {currentBalance >= 0 ? "+" : ""}
            {money.format(currentBalance)}
          </strong>
        </article>
        <article>
          <span>Operaciones cerradas</span>
          <strong>{closedCount}</strong>
        </article>
      </div>

      <Link className="capital-details-trigger" href="/inversiones">
        <span className="credit-trigger-icon">↗</span>
        <span className="credit-trigger-copy">
          <strong>Gestionar mis inversiones</strong>
          <small>Añade, edita y revisa tus operaciones</small>
        </span>
        <span className="credit-trigger-action">
          <strong>Ver inversiones →</strong>
        </span>
      </Link>
    </section>
  );
}
