export const money = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function toSoles(
  amount: number,
  currency: "PEN" | "USD",
  exchangeRate: number,
) {
  return currency === "USD" ? amount * exchangeRate : amount;
}

export function formatInvestmentAmount(
  amount: number,
  currency: Currency,
) {
  return currency === "USD" ? dollars.format(amount) : money.format(amount);
}

export function getAdditionalCostsTotal(additionalCosts: AdditionalCost[]) {
  return additionalCosts.reduce(
    (sum, item) =>
      sum + toSoles(item.amount, item.currency, item.exchangeRate),
    0,
  );
}

export function getInvestmentCostInSoles(investment: {
  amount: number;
  currency: Currency;
  exchangeRate: number;
  additionalCosts: AdditionalCost[];
}) {
  return (
    toSoles(investment.amount, investment.currency, investment.exchangeRate) +
    getAdditionalCostsTotal(investment.additionalCosts)
  );
}

export function getLoanFundedInvestmentCost(investment: {
  amount: number;
  currency: Currency;
  exchangeRate: number;
  capitalSource: CapitalSource;
  additionalCosts: AdditionalCost[];
}) {
  const baseCost =
    investment.capitalSource === "loan"
      ? toSoles(
          investment.amount,
          investment.currency,
          investment.exchangeRate,
        )
      : 0;
  const loanFundedAdditionals = investment.additionalCosts.reduce(
    (sum, item) =>
      item.capitalSource === "loan"
        ? sum + toSoles(item.amount, item.currency, item.exchangeRate)
        : sum,
    0,
  );

  return baseCost + loanFundedAdditionals;
}

export function getCreditFundedInvestmentCost(
  investment: {
    amount: number;
    currency: Currency;
    exchangeRate: number;
    capitalSource: CapitalSource;
    creditId?: number | null;
    additionalCosts: AdditionalCost[];
  },
  creditId: number,
) {
  const baseCost =
    investment.capitalSource === "loan" && investment.creditId === creditId
      ? toSoles(investment.amount, investment.currency, investment.exchangeRate)
      : 0;
  const additionalCost = investment.additionalCosts.reduce(
    (sum, item) =>
      item.capitalSource === "loan" && item.creditId === creditId
        ? sum + toSoles(item.amount, item.currency, item.exchangeRate)
        : sum,
    0,
  );

  return baseCost + additionalCost;
}
import type { AdditionalCost, CapitalSource, Currency } from "./types";
