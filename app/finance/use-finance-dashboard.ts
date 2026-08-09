import { useEffect, useMemo, useState } from "react";
import type {
  AdditionalCost,
  CapitalSource,
  Credit,
  CreditChanges,
  Currency,
  Investment,
  InvestmentDraft,
  InvestmentStatus,
  InvestmentValues,
  StoredData,
} from "./types";
import {
  getInvestmentCostInSoles,
  getCreditFundedInvestmentCost,
  getLoanFundedInvestmentCost,
  toSoles,
} from "./format";

const STORAGE_KEY = "flujo-finanzas-v2";

export const EMPTY_DRAFT: InvestmentDraft = {
  name: "",
  amount: "",
  salePricePen: "",
  currency: "PEN",
  exchangeRate: "",
  capitalSource: "loan",
  creditId: null,
  additionalCosts: [],
};

function createEmptyCredit(number: number, id = Date.now()): Credit {
  return {
    id,
    name: `Crédito ${number}`,
    loan: 0,
    months: 0,
    installments: 0,
    payment: 0,
    firstPaymentDate: "",
    paidInstallments: [],
  };
}

type PersistedAdditionalCost = Omit<
  AdditionalCost,
  "currency" | "exchangeRate" | "capitalSource"
> & {
  currency?: Currency;
  exchangeRate?: number;
  capitalSource?: CapitalSource;
};

type PersistedInvestment = Omit<
  Investment,
  | "salePricePen"
  | "currency"
  | "exchangeRate"
  | "capitalSource"
  | "additionalCosts"
> & {
  salePricePen?: number;
  salePrice?: number;
  profit?: number;
  currency?: Currency;
  exchangeRate?: number;
  capitalSource?: CapitalSource;
  additionalCosts?: PersistedAdditionalCost[];
};

type PersistedData = {
  credits?: Credit[];
  activeCreditId?: number;
  investments?: PersistedInvestment[];
  loan?: number;
  months?: number;
  installments?: number;
  payment?: number;
  firstPaymentDate?: string;
  paidInstallments?: number[];
};

function readStoredData(): PersistedData | null {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as PersistedData;
  } catch {
    return null;
  }
}

function getCreditTotals(credit: Credit) {
  const repayment = credit.installments * credit.payment;
  const validPaidInstallments = new Set(
    credit.paidInstallments.filter(
      (installment) =>
        installment >= 1 && installment <= credit.installments,
    ),
  );
  const paidCount = validPaidInstallments.size;
  const paidAmount = Math.min(repayment, paidCount * credit.payment);

  return {
    repayment,
    paidCount,
    paidAmount,
    remainingRepayment: Math.max(0, repayment - paidAmount),
    remainingLoan: Math.max(0, credit.loan - paidAmount),
    remainingInstallments: Math.max(0, credit.installments - paidCount),
    paymentProgress: repayment > 0 ? (paidAmount / repayment) * 100 : 0,
    cost:
      credit.loan > 0 && repayment > 0 ? repayment - credit.loan : 0,
  };
}

export function useFinanceDashboard() {
  const initialCredit = useMemo(() => createEmptyCredit(1, 1), []);
  const [credits, setCredits] = useState<Credit[]>([initialCredit]);
  const [activeCreditId, setActiveCreditId] = useState(initialCredit.id);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [draft, setDraft] = useState<InvestmentDraft>(EMPTY_DRAFT);
  const [isStorageReady, setIsStorageReady] = useState(false);

  const activeCredit =
    credits.find((credit) => credit.id === activeCreditId) ?? credits[0];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const data = readStoredData();
      if (data) {
        const storedCredits = data.credits?.length
          ? data.credits.map((credit, index) => ({
              ...createEmptyCredit(index + 1, credit.id),
              ...credit,
              name: credit.name?.trim() || `Crédito ${index + 1}`,
              paidInstallments: credit.paidInstallments ?? [],
            }))
          : [
              {
                ...createEmptyCredit(1, 1),
                loan: data.loan ?? 0,
                months: data.months ?? 0,
                installments: data.installments ?? 0,
                payment: data.payment ?? 0,
                firstPaymentDate: data.firstPaymentDate ?? "",
                paidInstallments: data.paidInstallments ?? [],
              },
            ];

        const validCreditIds = new Set(
          storedCredits.map((credit) => credit.id),
        );
        const fallbackCreditId = storedCredits[0].id;
        const storedInvestments = (data.investments ?? []).map((item) => {
          const currency = item.currency ?? "PEN";
          const exchangeRate =
            currency === "USD" ? (item.exchangeRate ?? 1) : 1;
          const legacySalePrice =
            item.salePrice ?? item.amount + (item.profit ?? 0);
          const capitalSource = item.capitalSource ?? "loan";
          const creditId =
            capitalSource === "loan"
              ? validCreditIds.has(item.creditId ?? -1)
                ? item.creditId
                : fallbackCreditId
              : undefined;
          const additionalCosts = (item.additionalCosts ?? []).map(
            (additional) => {
              const additionalCurrency = additional.currency ?? "PEN";
              const additionalCapitalSource =
                additional.capitalSource ?? capitalSource;
              return {
                ...additional,
                currency: additionalCurrency,
                exchangeRate:
                  additionalCurrency === "USD"
                    ? (additional.exchangeRate ?? 1)
                    : 1,
                capitalSource: additionalCapitalSource,
                creditId:
                  additionalCapitalSource === "loan"
                    ? validCreditIds.has(additional.creditId ?? -1)
                      ? additional.creditId
                      : (creditId ?? fallbackCreditId)
                    : undefined,
              };
            },
          );

          return {
            ...item,
            status: item.status ?? "open",
            salePricePen:
              item.salePricePen ??
              toSoles(legacySalePrice, currency, exchangeRate),
            currency,
            exchangeRate,
            capitalSource,
            creditId,
            additionalCosts,
          };
        });
        const repairedCredits = storedCredits.map((credit) => {
          const committedCapital = storedInvestments
            .filter((investment) => investment.status === "open")
            .reduce(
              (sum, investment) =>
                sum + getCreditFundedInvestmentCost(investment, credit.id),
              0,
            );
          return credit.loan + 0.005 < committedCapital
            ? { ...credit, loan: committedCapital }
            : credit;
        });

        setCredits(repairedCredits);
        setActiveCreditId(
          repairedCredits.some((credit) => credit.id === data.activeCreditId)
            ? (data.activeCreditId as number)
            : repairedCredits[0].id,
        );
        setInvestments(storedInvestments);
      }
      setIsStorageReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isStorageReady) return;

    const data: StoredData = { credits, activeCreditId, investments };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [activeCreditId, credits, investments, isStorageReady]);

  const activeCreditTotals = useMemo(
    () => getCreditTotals(activeCredit),
    [activeCredit],
  );

  function getAttributedCreditCost(
    investment: InvestmentValues,
    creditId: number,
  ) {
    const validCreditIds = new Set(credits.map((credit) => credit.id));
    const fallbackCreditId = credits[0].id;
    return getCreditFundedInvestmentCost(
      {
        ...investment,
        creditId:
          investment.capitalSource === "loan"
            ? validCreditIds.has(investment.creditId ?? -1)
              ? investment.creditId
              : fallbackCreditId
            : undefined,
        additionalCosts: investment.additionalCosts.map((additional) => ({
          ...additional,
          creditId:
            additional.capitalSource === "loan"
              ? validCreditIds.has(additional.creditId ?? -1)
                ? additional.creditId
                : fallbackCreditId
              : undefined,
        })),
      },
      creditId,
    );
  }

  const creditCommitments = Object.fromEntries(
    credits.map((credit) => [
      credit.id,
      investments
        .filter((investment) => investment.status === "open")
        .reduce(
          (sum, investment) =>
            sum + getAttributedCreditCost(investment, credit.id),
          0,
        ),
    ]),
  ) as Record<number, number>;

  function canFundInvestment(
    investment: InvestmentValues,
    excludedInvestmentId?: number,
  ) {
    return credits.every((credit) => {
      const usedCapital = investments
        .filter(
          (item) =>
            item.status === "open" && item.id !== excludedInvestmentId,
        )
        .reduce(
          (sum, item) =>
            sum + getAttributedCreditCost(item, credit.id),
          0,
        );
      const paidAmount = getCreditTotals(credit).paidAmount;
      const availableCapital = Math.max(0, credit.loan - paidAmount - usedCapital);
      return (
        getAttributedCreditCost(investment, credit.id) <=
        availableCapital + 0.005
      );
    });
  }

  const totals = useMemo(() => {
    const open = investments.filter((item) => item.status === "open");
    const closed = investments.filter((item) => item.status === "closed");
    const openCapital = open.reduce(
      (sum, item) => sum + getInvestmentCostInSoles(item),
      0,
    );
    const invested = open.reduce(
      (sum, item) => sum + getLoanFundedInvestmentCost(item),
      0,
    );
    const projectedProfit = open.reduce(
      (sum, item) =>
        sum + item.salePricePen - getInvestmentCostInSoles(item),
      0,
    );
    const currentBalance = closed.reduce(
      (sum, item) =>
        sum + item.salePricePen - getInvestmentCostInSoles(item),
      0,
    );
    const creditTotals = credits.map(getCreditTotals);
    const totalLoan = credits.reduce((sum, credit) => sum + credit.loan, 0);
    const repayment = creditTotals.reduce(
      (sum, credit) => sum + credit.repayment,
      0,
    );
    const paidAmount = creditTotals.reduce(
      (sum, credit) => sum + credit.paidAmount,
      0,
    );
    const paidCount = creditTotals.reduce(
      (sum, credit) => sum + credit.paidCount,
      0,
    );
    const remainingRepayment = creditTotals.reduce(
      (sum, credit) => sum + credit.remainingRepayment,
      0,
    );
    const remainingLoan = creditTotals.reduce(
      (sum, credit) => sum + credit.remainingLoan,
      0,
    );
    const remainingInstallments = creditTotals.reduce(
      (sum, credit) => sum + credit.remainingInstallments,
      0,
    );
    const totalInstallments = credits.reduce(
      (sum, credit) => sum + credit.installments,
      0,
    );
    const paymentProgress =
      repayment > 0 ? (paidAmount / repayment) * 100 : 0;
    const totalCapital = totalLoan + currentBalance - paidAmount;

    return {
      open,
      closed,
      invested,
      openCapital,
      projectedProfit,
      currentBalance,
      totalCapital,
      totalLoan,
      totalInstallments,
      repayment,
      paidAmount,
      paidCount,
      remainingRepayment,
      remainingLoan,
      remainingInstallments,
      paymentProgress,
      available: totalCapital - invested,
      cost: credits.reduce(
        (sum, credit) => sum + getCreditTotals(credit).cost,
        0,
      ),
    };
  }, [credits, investments]);

  const paymentSchedule = useMemo(() => {
    if (
      !activeCredit.firstPaymentDate ||
      activeCredit.installments <= 0 ||
      activeCredit.payment <= 0
    ) {
      return [];
    }

    const [year, month, day] = activeCredit.firstPaymentDate
      .split("-")
      .map(Number);
    if (!year || !month || !day) return [];

    return Array.from({ length: activeCredit.installments }, (_, index) => {
      const targetMonth = month - 1 + index;
      const lastDay = new Date(year, targetMonth + 1, 0).getDate();
      return {
        number: index + 1,
        date: new Date(year, targetMonth, Math.min(day, lastDay)),
        amount: activeCredit.payment,
      };
    });
  }, [activeCredit]);

  function updateActiveCredit<K extends keyof Credit>(
    field: K,
    value: Credit[K],
  ) {
    setCredits((current) =>
      current.map((credit) =>
        credit.id === activeCredit.id ? { ...credit, [field]: value } : credit,
      ),
    );
  }

  function addCredit() {
    const existingNames = new Set(credits.map((credit) => credit.name));
    let number = credits.length + 1;
    while (existingNames.has(`Crédito ${number}`)) number += 1;
    const nextId = Math.max(
      Date.now(),
      ...credits.map((credit) => credit.id + 1),
    );
    const newCredit = createEmptyCredit(number, nextId);
    setCredits((current) => [...current, newCredit]);
    setActiveCreditId(nextId);
    return newCredit;
  }

  function updateDraft<K extends keyof InvestmentDraft>(
    field: K,
    value: InvestmentDraft[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function addInvestment() {
    const amount = Number(draft.amount);
    const salePricePen = Number(draft.salePricePen);
    const exchangeRate =
      draft.currency === "USD" ? Number(draft.exchangeRate) : 1;
    if (
      !draft.name.trim() ||
      amount <= 0 ||
      salePricePen <= 0 ||
      exchangeRate <= 0
    ) {
      return false;
    }

    const values: InvestmentValues = {
      name: draft.name.trim(),
      amount,
      salePricePen,
      currency: draft.currency,
      exchangeRate,
      capitalSource: draft.capitalSource,
      creditId:
        draft.capitalSource === "loan"
          ? (draft.creditId ?? activeCreditId)
          : undefined,
      additionalCosts: draft.additionalCosts,
    };
    if (!canFundInvestment(values)) return false;

    setInvestments((items) => [
      ...items,
      {
        id: Date.now(),
        ...values,
        status: "open",
      },
    ]);
    setDraft(EMPTY_DRAFT);
    return true;
  }

  function changeStatus(id: number, status: InvestmentStatus) {
    const investment = investments.find((item) => item.id === id);
    if (!investment) return false;
    if (status === "open" && !canFundInvestment(investment)) {
      return false;
    }

    setInvestments((items) =>
      items.map((item) => (item.id === id ? { ...item, status } : item)),
    );
    return true;
  }

  function editInvestment(id: number, values: InvestmentValues) {
    const current = investments.find((item) => item.id === id);
    if (!current) return false;

    if (
      current.status === "open" &&
      !canFundInvestment(values, current.id)
    ) {
      return false;
    }

    setInvestments((items) =>
      items.map((item) => (item.id === id ? { ...item, ...values } : item)),
    );
    return true;
  }

  function removeInvestment(id: number) {
    setInvestments((items) => items.filter((item) => item.id !== id));
  }

  function duplicateInvestment(id: number) {
    const source = investments.find((item) => item.id === id);
    if (!source) return false;
    if (!canFundInvestment(source)) {
      return false;
    }

    setInvestments((items) => {
      const nextId = Math.max(Date.now(), ...items.map((item) => item.id + 1));
      const baseName = source.name.replace(/\s+\(\d+\)$/, "");
      const existingNames = new Set(items.map((item) => item.name));
      let duplicateNumber = 1;
      while (existingNames.has(`${baseName} (${duplicateNumber})`)) {
        duplicateNumber += 1;
      }

      return [
        ...items,
        {
          ...source,
          id: nextId,
          name: `${baseName} (${duplicateNumber})`,
          status: "open",
          additionalCosts: source.additionalCosts.map((item) => ({ ...item })),
        },
      ];
    });
    return true;
  }

  function toggleInstallmentPaid(installment: number) {
    updateActiveCredit(
      "paidInstallments",
      activeCredit.paidInstallments.includes(installment)
        ? activeCredit.paidInstallments.filter((item) => item !== installment)
        : [...activeCredit.paidInstallments, installment].sort((a, b) => a - b),
    );
  }

  function setActiveCreditLoan(value: number) {
    const committedCapital = creditCommitments[activeCredit.id] ?? 0;
    if (value + 0.005 < committedCapital) return false;
    updateActiveCredit("loan", value);
    return true;
  }

  function saveCredit(id: number, changes: CreditChanges) {
    const committedCapital = creditCommitments[id] ?? 0;
    if (changes.loan + 0.005 < committedCapital) return false;

    setCredits((current) =>
      current.map((credit) =>
        credit.id === id
          ? {
              ...credit,
              ...changes,
              name: changes.name.trim() || credit.name,
            }
          : credit,
      ),
    );
    return true;
  }

  function removeCredit(id: number) {
    const hasOpenInvestment = investments.some(
      (investment) =>
        investment.status === "open" &&
        getAttributedCreditCost(investment, id) > 0.005,
    );
    if (hasOpenInvestment) {
      return "has-open-investments" as const;
    }
    if (credits.length === 1) {
      const replacementId = Math.max(Date.now(), id + 1);
      const replacement = createEmptyCredit(1, replacementId);
      setCredits([replacement]);
      setActiveCreditId(replacementId);
      return "deleted" as const;
    }

    const remainingCredits = credits.filter((credit) => credit.id !== id);
    setCredits(remainingCredits);
    if (activeCreditId === id) setActiveCreditId(remainingCredits[0].id);
    return "deleted" as const;
  }

  return {
    credits,
    activeCredit,
    activeCreditId,
    activeCreditTotals,
    creditCommitments,
    creditCount: credits.filter((credit) => credit.loan > 0).length,
    loan: activeCredit.loan,
    months: activeCredit.months,
    installments: activeCredit.installments,
    payment: activeCredit.payment,
    firstPaymentDate: activeCredit.firstPaymentDate,
    paidInstallments: activeCredit.paidInstallments,
    investments,
    draft,
    totals,
    paymentSchedule,
    availablePercentage:
      totals.totalCapital > 0
        ? Math.max(0, (totals.available / totals.totalCapital) * 100)
        : 0,
    investedPercentage:
      totals.totalCapital > 0
        ? Math.min(100, Math.max(0, (totals.invested / totals.totalCapital) * 100))
        : 0,
    expectedReturn: totals.openCapital
      ? (totals.projectedProfit / totals.openCapital) * 100
      : 0,
    setActiveCreditId,
    addCredit,
    saveCredit,
    removeCredit,
    setCreditName: (value: string) => updateActiveCredit("name", value),
    setLoan: setActiveCreditLoan,
    setMonths: (value: number) => updateActiveCredit("months", value),
    setInstallments: (value: number) =>
      updateActiveCredit("installments", value),
    setPayment: (value: number) => updateActiveCredit("payment", value),
    setFirstPaymentDate: (value: string) =>
      updateActiveCredit("firstPaymentDate", value),
    updateDraft,
    addInvestment,
    changeStatus,
    editInvestment,
    removeInvestment,
    duplicateInvestment,
    toggleInstallmentPaid,
  };
}
