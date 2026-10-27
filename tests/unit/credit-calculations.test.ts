import { describe, expect, it } from "vitest";
import { getCreditTotals } from "../../app/finance/credit-calculations";

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
