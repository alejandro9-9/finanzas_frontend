import type { Credit } from "./types";

type CreditWithRecordedPayments = Credit & {
  paidAmountsByInstallment?: Record<number, number>;
};

const roundToCents = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

export function getInstallmentAllocation(
  credit: Pick<Credit, "loan" | "installments" | "payment">,
  installmentNumber: number,
) {
  if (credit.installments <= 0 || installmentNumber < 1 || installmentNumber > credit.installments) {
    return { principal: 0, interest: 0 };
  }

  const totalInterest = Math.max(0, credit.installments * credit.payment - credit.loan);
  const monthlyInterest = roundToCents(totalInterest / credit.installments);
  const monthlyPrincipal = Math.max(0, credit.payment - monthlyInterest);
  const principal = installmentNumber === credit.installments
    ? Math.max(0, roundToCents(credit.loan - monthlyPrincipal * (credit.installments - 1)))
    : monthlyPrincipal;

  return {
    principal: Math.min(credit.payment, principal),
    interest: Math.max(0, roundToCents(credit.payment - principal)),
  };
}

export function getCreditTotals(credit: CreditWithRecordedPayments) {
  const repayment = credit.installments * credit.payment;
  const totalInterest = Math.max(0, repayment - credit.loan);
  const paidCount = new Set(credit.paidInstallments).size;
  const recordedPayments = credit.paidAmountsByInstallment
    ? Object.entries(credit.paidAmountsByInstallment).map(([number, amount]) => [
        Number(number),
        Math.min(credit.payment, Math.max(0, amount)),
      ] as const)
    : [...new Set(credit.paidInstallments)].map((number) => [number, credit.payment] as const);
  const paidAmount = Math.min(
    repayment,
    recordedPayments.reduce((sum, [, amount]) => sum + amount, 0),
  );
  const principalPaid = Math.min(
    credit.loan,
    recordedPayments.reduce((sum, [number, amount]) => {
      if (number < 1 || number > credit.installments) return sum;
      const allocation = getInstallmentAllocation(credit, number);
      const interestPaid = Math.min(amount, allocation.interest);
      const principalPortionPaid = Math.min(
        allocation.principal,
        Math.max(0, amount - interestPaid),
      );
      return sum + principalPortionPaid;
    }, 0),
  );

  return {
    repayment,
    paidCount,
    paidAmount,
    principalPaid,
    remainingRepayment: Math.max(0, repayment - paidAmount),
    remainingLoan: Math.max(0, credit.loan - principalPaid),
    remainingInstallments: Math.max(0, credit.installments - paidCount),
    paymentProgress: repayment > 0 ? (paidAmount / repayment) * 100 : 0,
    cost: totalInterest,
  };
}
