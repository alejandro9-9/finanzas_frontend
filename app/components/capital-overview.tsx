import Link from "next/link";
import { money } from "../finance/format";

type CapitalOverviewProps = {
  totalCapital: number;
  available: number;
  invested: number;
  nonLoanUsed: number;
  projectedProfit: number;
  currentBalance: number;
  openCount: number;
  closedCount: number;
};

export function CapitalOverview({
  totalCapital,
  available,
  invested,
  nonLoanUsed,
  projectedProfit,
  currentBalance,
  openCount,
  closedCount,
}: CapitalOverviewProps) {
  const usagePercentage =
    totalCapital > 0
      ? Math.min(100, Math.max(0, (invested / totalCapital) * 100))
      : 0;
  const activeInvestmentCapital = invested + nonLoanUsed;
  const nonLoanUsagePercentage =
    activeInvestmentCapital > 0
      ? (nonLoanUsed / activeInvestmentCapital) * 100
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
          aria-label={`${usagePercentage.toFixed(0)} por ciento del capital de créditos usado`}
          style={{
            background: `conic-gradient(var(--lime) ${usagePercentage}%, #343730 ${usagePercentage}% 100%)`,
          }}
        >
          <div>
            <strong>{usagePercentage.toFixed(0)}%</strong>
            <span>crédito usado</span>
          </div>
        </div>

        <div
          className="capital-ring capital-ring-non-loan"
          role="img"
          aria-label={`${nonLoanUsagePercentage.toFixed(0)} por ciento de las inversiones activas se financia sin préstamo`}
          style={{
            background: `conic-gradient(#9874df ${nonLoanUsagePercentage}%, #343730 ${nonLoanUsagePercentage}% 100%)`,
          }}
        >
          <div>
            <strong>{nonLoanUsagePercentage.toFixed(0)}%</strong>
            <span>sin préstamo</span>
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
          <div className="capital-overview-non-loan">
            <span>Dinero usado sin préstamo</span>
            <strong>{money.format(nonLoanUsed)}</strong>
          </div>
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
