import { describe, expect, it } from "vitest";
import {
  distributeProfitProportionally,
  getCreditTotals,
} from "../../app/finance/credit-calculations";

describe("non-loan profit distribution", () => {
  it("assigns all realized profit to the only credit with principal remaining", () => {
    expect(distributeProfitProportionally(380.58, [
      { id: "active", remainingPrincipal: 5_000 },
      { id: "completed", remainingPrincipal: 0 },
    ])).toEqual({ active: 380.58 });
  });

  it("splits profit by remaining principal and preserves every cent", () => {
    const distribution = distributeProfitProportionally(380.58, [
      { id: "larger", remainingPrincipal: 5_000 },
      { id: "smaller", remainingPrincipal: 3_000 },
    ]);

    expect(distribution).toEqual({ larger: 237.86, smaller: 142.72 });
    expect(Object.values(distribution).reduce((sum, amount) => sum + amount, 0)).toBeCloseTo(380.58, 2);
  });

  it("does not distribute losses or when no credits have principal remaining", () => {
    expect(distributeProfitProportionally(-10, [{ id: "credit", remainingPrincipal: 500 }])).toEqual({});
    expect(distributeProfitProportionally(10, [{ id: "credit", remainingPrincipal: 0 }])).toEqual({});
  });
});

describe("credit principal calculations", () => {
  it("splits total interest evenly and subtracts only principal from the balance", () => {
    const totals = getCreditTotals({
      id: "credit-1",
      name: "Préstamo Falabella",
      loan: 5_000,
      months: 29,
      installments: 29,
      payment: 284.83,
      firstPaymentDate: "2026-09-05",
      paidInstallments: [1, 2],
      paidAmountsByInstallment: { 1: 284.83, 2: 284.83 },
    });

    expect(totals.cost).toBeCloseTo(3_260.07, 2);
    expect(totals.paidAmount).toBeCloseTo(569.66, 2);
    expect(totals.principalPaid).toBeCloseTo(344.82, 2);
    expect(totals.remainingLoan).toBeCloseTo(4_655.18, 2);
    expect(totals.remainingRepayment).toBeCloseTo(7_690.41, 2);
  });

  it("includes partial installment payments and applies them to interest first", () => {
    const totals = getCreditTotals({
      id: "credit-2",
      name: "Préstamo con pago parcial",
      loan: 900,
      months: 3,
      installments: 3,
      payment: 400,
      firstPaymentDate: "2026-09-05",
      paidInstallments: [],
      paidAmountsByInstallment: { 1: 125 },
    });

    expect(totals.paidAmount).toBe(125);
    expect(totals.principalPaid).toBe(25);
    expect(totals.remainingLoan).toBe(875);
  });
});
