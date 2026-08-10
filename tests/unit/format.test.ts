import { describe, expect, it } from "vitest";
import {
  getAdditionalCostsTotal,
  getCreditFundedInvestmentCost,
  getInvestmentCostInSoles,
  getLoanFundedInvestmentCost,
  normalizeCurrency,
  toSoles,
} from "../../app/finance/format";
import type { AdditionalCost, Investment } from "../../app/finance/types";

const additionalCosts: AdditionalCost[] = [
  {
    id: "shipping",
    name: "Envío",
    amount: 100,
    currency: "PEN",
    exchangeRate: 1,
    capitalSource: "savings",
  },
  {
    id: "repair",
    name: "Reparación",
    amount: 50,
    currency: "USD",
    exchangeRate: 3.75,
    capitalSource: "loan",
    creditId: "credit-1",
  },
];

const investment: Investment = {
  id: "investment-1",
  name: "Laptop",
  amount: 1_000,
  salePricePen: 5_000,
  currency: "USD",
  exchangeRate: 3.75,
  capitalSource: "loan",
  creditId: "credit-1",
  additionalCosts,
  status: "open",
};

describe("finance format calculations", () => {
  it("converts only USD amounts to soles", () => {
    expect(toSoles(100, "PEN", 3.75)).toBe(100);
    expect(toSoles(100, "USD", 3.75)).toBe(375);
    expect(toSoles(419, "usd" as "USD", 3.39)).toBeCloseTo(1_420.41);
    expect(normalizeCurrency("usd")).toBe("USD");
  });

  it("calculates profit from a dollar cost and a sale price in soles", () => {
    const costInSoles = toSoles(419, "USD", 3.39);

    expect(1_850 - costInSoles).toBeCloseTo(429.59);
  });

  it("adds costs using each cost exchange rate", () => {
    expect(getAdditionalCostsTotal(additionalCosts)).toBe(287.5);
  });

  it("calculates the complete investment cost in soles", () => {
    expect(getInvestmentCostInSoles(investment)).toBe(4_037.5);
  });

  it("includes only costs funded by loans", () => {
    expect(getLoanFundedInvestmentCost(investment)).toBe(3_937.5);
  });

  it("filters loan-funded costs by credit", () => {
    expect(getCreditFundedInvestmentCost(investment, "credit-1")).toBe(3_937.5);
    expect(getCreditFundedInvestmentCost(investment, "credit-2")).toBe(0);
  });
});
