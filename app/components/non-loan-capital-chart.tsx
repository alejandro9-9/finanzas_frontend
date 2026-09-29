import type { CapitalSource } from "../finance/types";
import { money } from "../finance/format";

type NonLoanCapitalChartProps = {
  data: { source: Exclude<CapitalSource, "loan">; amount: number }[];
};

const sourceDetails: Record<
  Exclude<CapitalSource, "loan">,
  { label: string; color: string }
> = {
  card: { label: "Tarjeta", color: "#9874df" },
  savings: { label: "Efectivo / ahorros", color: "#43a77b" },
  person: { label: "Otra persona", color: "#d08b4c" },
};

export function NonLoanCapitalChart({ data }: NonLoanCapitalChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const maxAmount = Math.max(...data.map((item) => item.amount), 0);

  return (
    <section className="panel non-loan-chart">
      <div className="section-head">
        <div>
          <p className="eyebrow">03 · OTRAS FUENTES</p>
          <h2>Dinero usado sin préstamo</h2>
        </div>
        <strong className="non-loan-chart-total">{money.format(total)}</strong>
      </div>

      <p className="non-loan-chart-description">
        Capital de inversiones activas cubierto con tarjeta, efectivo u otras personas.
      </p>

      {total > 0 ? (
        <div className="non-loan-chart-rows" aria-label="Uso de capital por fuente, sin préstamos">
          {data.map(({ source, amount }) => {
            const details = sourceDetails[source];
            const width = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
            const share = (amount / total) * 100;

            return (
              <div className="non-loan-chart-row" key={source}>
                <div className="non-loan-chart-label">
                  <span>
                    <i style={{ backgroundColor: details.color }} />
                    {details.label}
                  </span>
                  <strong>{money.format(amount)}</strong>
                </div>
                <div
                  className="non-loan-chart-track"
                  role="img"
                  aria-label={`${details.label}: ${money.format(amount)}, ${share.toFixed(0)} por ciento del total`}
                >
                  <i
                    style={{
                      width: `${width}%`,
                      backgroundColor: details.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="non-loan-chart-empty">
          Aún no hay dinero de otras fuentes comprometido en inversiones activas.
        </div>
      )}
    </section>
  );
}
