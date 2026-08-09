import { money } from "../finance/format";

type BalanceFooterProps = {
  currentBalance: number;
  invested: number;
  totalCapital: number;
  investedPercentage: number;
};

export function BalanceFooter({
  currentBalance,
  invested,
  totalCapital,
  investedPercentage,
}: BalanceFooterProps) {
  return (
    <section className="bottom">
      <div>
        <p className="eyebrow">BALANCE ACTUAL</p>
        <h2>{money.format(currentBalance)}</h2>
        <span>Utilidad realizada en inversiones cerradas</span>
      </div>
      <div className="bar-wrap">
        <div className="bar-label">
          <span>Capital reutilizable en inversiones abiertas</span>
          <strong>{investedPercentage.toFixed(0)}%</strong>
        </div>
        <div className="bar">
          <i style={{ width: `${investedPercentage}%` }} />
        </div>
        <small>
          {money.format(invested)} en uso de {money.format(totalCapital)}
        </small>
      </div>
    </section>
  );
}
