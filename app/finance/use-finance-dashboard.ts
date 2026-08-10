import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { financeApi, loadFinanceSnapshot } from "../api/finance";
import type {
  CapitalAccountResponse,
  CapitalAccountType,
  CreditInstallmentResponse,
  FinanceSnapshot,
} from "../api/contracts";
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
} from "./types";
import {
  getCreditFundedInvestmentCost,
  getInvestmentCostInSoles,
  getLoanFundedInvestmentCost,
} from "./format";

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

function accountTypeToSource(type: CapitalAccountType): CapitalSource {
  return type === "creditCard" ? "card" : type;
}

function sourceToAccountType(source: CapitalSource): CapitalAccountType {
  return source === "card" ? "creditCard" : source;
}

function getCreditTotals(credit: Credit) {
  const repayment = credit.installments * credit.payment;
  const paidCount = new Set(credit.paidInstallments).size;
  const paidAmount = Math.min(repayment, paidCount * credit.payment);

  return {
    repayment,
    paidCount,
    paidAmount,
    remainingRepayment: Math.max(0, repayment - paidAmount),
    remainingLoan: Math.max(0, credit.loan - paidAmount),
    remainingInstallments: Math.max(0, credit.installments - paidCount),
    paymentProgress: repayment > 0 ? (paidAmount / repayment) * 100 : 0,
    cost: credit.loan > 0 && repayment > 0 ? repayment - credit.loan : 0,
  };
}

function mapSnapshot(snapshot: FinanceSnapshot) {
  const accounts = new Map(snapshot.capitalAccounts.map((account) => [account.id, account]));
  const credits: Credit[] = snapshot.credits
    .filter((credit) => credit.status !== "archived")
    .map((credit) => ({
      id: credit.id,
      name: credit.name,
      loan: credit.amount,
      months: credit.numberOfInstallments,
      installments: credit.numberOfInstallments,
      payment: credit.installmentAmount,
      firstPaymentDate: credit.firstDueDate,
      paidInstallments: (snapshot.installmentsByCreditId[credit.id] ?? [])
        .filter((installment) => installment.status === "paid")
        .map((installment) => installment.number),
    }));

  const investments: Investment[] = snapshot.investments
    .filter((investment) => investment.status !== "archived")
    .map((investment) => {
      const account = accounts.get(investment.capitalAccountId);
      if (!account)
        throw new Error(`No se encontró la cuenta de capital de la inversión ${investment.id}.`);
      const additionalCosts: AdditionalCost[] = (
        snapshot.additionalCostsByInvestmentId[investment.id] ?? []
      ).map((cost) => {
        const costAccount = accounts.get(cost.capitalAccountId);
        if (!costAccount)
          throw new Error(`No se encontró la cuenta de capital del costo ${cost.id}.`);
        return {
          id: cost.id,
          capitalAccountId: cost.capitalAccountId,
          name: cost.description,
          amount: cost.originalAmount,
          currency: cost.currency,
          exchangeRate: cost.exchangeRate,
          capitalSource: accountTypeToSource(costAccount.type),
          creditId: cost.creditId ?? undefined,
        };
      });

      return {
        id: investment.id,
        capitalAccountId: investment.capitalAccountId,
        name: investment.name,
        amount: investment.originalAmount,
        salePricePen: investment.projectedSalePrice,
        currency: investment.currency,
        exchangeRate: investment.exchangeRate,
        capitalSource: accountTypeToSource(account.type),
        creditId: investment.creditId ?? undefined,
        additionalCosts,
        status: investment.status === "closed" ? "closed" : "open",
      };
    });

  return { credits, investments };
}

export function useFinanceDashboard() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [activeCreditId, setActiveCreditId] = useState<string | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const capitalAccountsRef = useRef<CapitalAccountResponse[]>([]);
  const [installmentsByCreditId, setInstallmentsByCreditId] = useState<Record<string, CreditInstallmentResponse[]>>({});
  const [draft, setDraft] = useState<InvestmentDraft>(EMPTY_DRAFT);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState("");

  function reportMutationError(caught: unknown, fallback: string) {
    if (caught instanceof TypeError) setHasLoaded(false);
    setError(caught instanceof Error ? caught.message : fallback);
  }

  const refresh = useCallback(async () => {
    setError("");
    try {
      const snapshot = await loadFinanceSnapshot();
      const mapped = mapSnapshot(snapshot);
      setCredits(mapped.credits);
      setInvestments(mapped.investments);
      const activeAccounts = snapshot.capitalAccounts.filter((account) => account.isActive);
      capitalAccountsRef.current = activeAccounts;
      setInstallmentsByCreditId(snapshot.installmentsByCreditId);
      setHasLoaded(true);
      setActiveCreditId((current) =>
        current && mapped.credits.some((credit) => credit.id === current)
          ? current
          : mapped.credits[0]?.id ?? null,
      );
    } catch (caught) {
      setHasLoaded(false);
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar tus datos financieros.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void refresh();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [refresh]);

  const activeCredit = credits.find((credit) => credit.id === activeCreditId) ?? null;
  const activeCreditTotals = useMemo(
    () => activeCredit ? getCreditTotals(activeCredit) : {
      repayment: 0,
      paidCount: 0,
      paidAmount: 0,
      remainingRepayment: 0,
      remainingLoan: 0,
      remainingInstallments: 0,
      paymentProgress: 0,
      cost: 0,
    },
    [activeCredit],
  );

  function getAttributedCreditCost(investment: InvestmentValues, creditId: string) {
    return getCreditFundedInvestmentCost(investment, creditId);
  }

  const creditCommitments = Object.fromEntries(
    credits.map((credit) => [
      credit.id,
      investments
        .filter((investment) => investment.status === "open")
        .reduce((sum, investment) => sum + getAttributedCreditCost(investment, credit.id), 0),
    ]),
  ) as Record<string, number>;

  function canFundInvestment(investment: InvestmentValues, excludedInvestmentId?: string) {
    return credits.every((credit) => {
      const used = investments
        .filter((item) => item.status === "open" && item.id !== excludedInvestmentId)
        .reduce((sum, item) => sum + getAttributedCreditCost(item, credit.id), 0);
      const available = Math.max(0, credit.loan - getCreditTotals(credit).paidAmount - used);
      return getAttributedCreditCost(investment, credit.id) <= available + 0.005;
    });
  }

  const totals = useMemo(() => {
    const open = investments.filter((item) => item.status === "open");
    const closed = investments.filter((item) => item.status === "closed");
    const openCapital = open.reduce((sum, item) => sum + getInvestmentCostInSoles(item), 0);
    const invested = open.reduce((sum, item) => sum + getLoanFundedInvestmentCost(item), 0);
    const projectedProfit = open.reduce(
      (sum, item) => sum + item.salePricePen - getInvestmentCostInSoles(item),
      0,
    );
    const currentBalance = closed.reduce(
      (sum, item) => sum + item.salePricePen - getInvestmentCostInSoles(item),
      0,
    );
    const creditTotals = credits.map(getCreditTotals);
    const totalLoan = credits.reduce((sum, credit) => sum + credit.loan, 0);
    const repayment = creditTotals.reduce((sum, credit) => sum + credit.repayment, 0);
    const paidAmount = creditTotals.reduce((sum, credit) => sum + credit.paidAmount, 0);
    const paidCount = creditTotals.reduce((sum, credit) => sum + credit.paidCount, 0);
    const remainingRepayment = creditTotals.reduce((sum, credit) => sum + credit.remainingRepayment, 0);
    const remainingLoan = creditTotals.reduce((sum, credit) => sum + credit.remainingLoan, 0);
    const remainingInstallments = creditTotals.reduce((sum, credit) => sum + credit.remainingInstallments, 0);
    const totalInstallments = credits.reduce((sum, credit) => sum + credit.installments, 0);
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
      paymentProgress: repayment > 0 ? (paidAmount / repayment) * 100 : 0,
      available: totalCapital - invested,
      cost: creditTotals.reduce((sum, credit) => sum + credit.cost, 0),
    };
  }, [credits, investments]);

  const paymentSchedule = useMemo(
    () => (activeCredit ? installmentsByCreditId[activeCredit.id] ?? [] : []).map((installment) => ({
      id: installment.id,
      number: installment.number,
      date: new Date(`${installment.dueDate}T00:00:00`),
      amount: installment.amount,
    })),
    [activeCredit, installmentsByCreditId],
  );

  async function saveCredit(id: string | null, changes: CreditChanges) {
    const committed = id ? creditCommitments[id] ?? 0 : 0;
    if (changes.loan + 0.005 < committed) return "capital-conflict" as const;
    setIsMutating(true);
    setError("");
    try {
      const request = {
        name: changes.name.trim(),
        amount: changes.loan,
        numberOfInstallments: changes.installments,
        installmentAmount: changes.payment,
        firstDueDate: changes.firstPaymentDate,
      };
      if (id === null) await financeApi.createCredit(request);
      else await financeApi.updateCredit(id, request);
      await refresh();
      return "saved" as const;
    } catch (caught) {
      reportMutationError(caught, "No se pudo guardar el crédito.");
      return "failed" as const;
    } finally {
      setIsMutating(false);
    }
  }

  async function removeCredit(id: string) {
    if ((creditCommitments[id] ?? 0) > 0.005) return "has-open-investments" as const;
    setIsMutating(true);
    try {
      await financeApi.archiveCredit(id);
      await refresh();
      return "deleted" as const;
    } catch (caught) {
      reportMutationError(caught, "No se pudo archivar el crédito.");
      return "failed" as const;
    } finally {
      setIsMutating(false);
    }
  }

  async function ensureCapitalAccount(
    source: CapitalSource,
    currency: Currency,
    creditId?: string,
  ) {
    const type = sourceToAccountType(source);
    const normalizedCreditId = source === "loan" ? creditId ?? null : null;
    const existing = capitalAccountsRef.current.find(
      (account) =>
        account.type === type &&
        account.currency === currency &&
        account.creditId === normalizedCreditId &&
        account.isActive,
    );
    if (existing) return existing.id;

    const credit = credits.find((item) => item.id === creditId);
    if (source === "loan" && !credit)
      throw new Error("El crédito asociado no existe en el backend.");
    const labels: Record<CapitalSource, string> = {
      loan: `Préstamo ${credit?.name}`,
      card: `Tarjeta en ${currency}`,
      savings: `Ahorros en ${currency}`,
      person: `Dinero personal en ${currency}`,
    };
    const id = await financeApi.createCapitalAccount({
      name: labels[source],
      type,
      currency,
      creditId: normalizedCreditId,
    });
    const createdAccount = await financeApi.getCapitalAccount(id);
    capitalAccountsRef.current = [...capitalAccountsRef.current, createdAccount];
    return id;
  }

  function updateDraft<K extends keyof InvestmentDraft>(field: K, value: InvestmentDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function persistAdditionalCosts(investmentId: string, costs: AdditionalCost[]) {
    for (const cost of costs) {
      const accountId = await ensureCapitalAccount(
        cost.capitalSource,
        cost.currency,
        cost.capitalSource === "loan" ? cost.creditId : undefined,
      );
      const request = {
        investmentId,
        capitalAccountId: accountId,
        creditId: cost.capitalSource === "loan" ? cost.creditId ?? null : null,
        description: cost.name,
        originalAmount: cost.amount,
        currency: cost.currency,
        exchangeRate: cost.currency === "USD" ? cost.exchangeRate : 1,
      };
      if (cost.id === null) await financeApi.createAdditionalCost(request);
      else await financeApi.updateAdditionalCost(cost.id, request);
    }
  }

  async function addInvestment() {
    const amount = Number(draft.amount);
    const salePricePen = Number(draft.salePricePen);
    const exchangeRate = draft.currency === "USD" ? Number(draft.exchangeRate) : 1;
    if (!draft.name.trim() || amount <= 0 || salePricePen <= 0 || exchangeRate <= 0) return false;
    const values: InvestmentValues = {
      name: draft.name.trim(),
      amount,
      salePricePen,
      currency: draft.currency,
      exchangeRate,
      capitalSource: draft.capitalSource,
      creditId: draft.capitalSource === "loan" ? draft.creditId ?? activeCreditId ?? undefined : undefined,
      additionalCosts: draft.additionalCosts,
    };
    if (values.capitalSource === "loan" && !values.creditId) return false;
    if (values.additionalCosts.some((cost) => cost.capitalSource === "loan" && !cost.creditId)) return false;
    if (!canFundInvestment(values)) return false;

    setIsMutating(true);
    try {
      const accountId = await ensureCapitalAccount(values.capitalSource, values.currency, values.creditId);
      const id = await financeApi.createInvestment({
        capitalAccountId: accountId,
        creditId: values.capitalSource === "loan" ? values.creditId ?? null : null,
        name: values.name,
        originalAmount: values.amount,
        currency: values.currency,
        exchangeRate: values.currency === "USD" ? values.exchangeRate : 1,
        projectedSalePrice: values.salePricePen,
      });
      await persistAdditionalCosts(id, values.additionalCosts);
      setDraft(EMPTY_DRAFT);
      await refresh();
      return true;
    } catch (caught) {
      reportMutationError(caught, "No se pudo registrar la inversión.");
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  async function changeStatus(id: string, status: InvestmentStatus) {
    const investment = investments.find((item) => item.id === id);
    if (!investment || (status === "open" && !canFundInvestment(investment))) return false;
    setIsMutating(true);
    try {
      if (status === "closed") await financeApi.closeInvestment(id);
      else await financeApi.reopenInvestment(id);
      await refresh();
      return true;
    } catch (caught) {
      reportMutationError(caught, "No se pudo cambiar el estado.");
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  async function editInvestment(id: string, values: InvestmentValues) {
    const current = investments.find((item) => item.id === id);
    if (!current || (current.status === "open" && !canFundInvestment(values, id))) return false;
    setIsMutating(true);
    try {
      const accountId = await ensureCapitalAccount(values.capitalSource, values.currency, values.creditId);
      await financeApi.updateInvestment(id, {
        capitalAccountId: accountId,
        creditId: values.capitalSource === "loan" ? values.creditId ?? null : null,
        name: values.name,
        originalAmount: values.amount,
        currency: values.currency,
        exchangeRate: values.currency === "USD" ? values.exchangeRate : 1,
        projectedSalePrice: values.salePricePen,
      });
      const retainedCostIds = new Set(
        values.additionalCosts.flatMap((cost) => cost.id ? [cost.id] : []),
      );
      const removedCosts = current.additionalCosts.filter(
        (cost) => cost.id !== null && !retainedCostIds.has(cost.id),
      );
      await Promise.all(
        removedCosts.flatMap((cost) =>
          cost.id ? [financeApi.archiveAdditionalCost(cost.id)] : [],
        ),
      );
      await persistAdditionalCosts(id, values.additionalCosts);
      await refresh();
      return true;
    } catch (caught) {
      reportMutationError(caught, "No se pudo actualizar la inversión.");
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  async function removeInvestment(id: string) {
    setIsMutating(true);
    try {
      await financeApi.archiveInvestment(id);
      await refresh();
    } catch (caught) {
      reportMutationError(caught, "No se pudo archivar la inversión.");
    } finally {
      setIsMutating(false);
    }
  }

  async function duplicateInvestment(id: string) {
    const source = investments.find((item) => item.id === id);
    if (!source || !canFundInvestment(source)) return false;
    setIsMutating(true);
    try {
      const accountId = await ensureCapitalAccount(
        source.capitalSource,
        source.currency,
        source.creditId,
      );
      const newId = await financeApi.createInvestment({
        capitalAccountId: accountId,
        creditId: source.capitalSource === "loan" ? source.creditId ?? null : null,
        name: `${source.name} (copia)`,
        originalAmount: source.amount,
        currency: source.currency,
        exchangeRate: source.currency === "USD" ? source.exchangeRate : 1,
        projectedSalePrice: source.salePricePen,
      });
      await persistAdditionalCosts(
        newId,
        source.additionalCosts.map((cost) => ({ ...cost, id: null })),
      );
      await refresh();
      return true;
    } catch (caught) {
      reportMutationError(caught, "No se pudo duplicar la inversión.");
      return false;
    } finally {
      setIsMutating(false);
    }
  }

  async function toggleInstallmentPaid(number: number) {
    if (!activeCredit) return;
    const installment = (installmentsByCreditId[activeCredit.id] ?? []).find(
      (item) => item.number === number,
    );
    if (!installment || installment.status === "paid") return;
    setIsMutating(true);
    try {
      await financeApi.payInstallment(installment.id, installment.amount - installment.paidAmount);
      await refresh();
    } catch (caught) {
      reportMutationError(caught, "No se pudo registrar el pago.");
    } finally {
      setIsMutating(false);
    }
  }

  return {
    credits,
    activeCredit,
    activeCreditId,
    activeCreditTotals,
    creditCommitments,
    creditCount: credits.length,
    loan: activeCredit?.loan ?? 0,
    months: activeCredit?.months ?? 0,
    installments: activeCredit?.installments ?? 0,
    payment: activeCredit?.payment ?? 0,
    firstPaymentDate: activeCredit?.firstPaymentDate ?? "",
    paidInstallments: activeCredit?.paidInstallments ?? [],
    investments,
    draft,
    totals,
    paymentSchedule,
    isLoading,
    hasLoaded,
    isMutating,
    error,
    refresh,
    availablePercentage: totals.totalCapital > 0 ? Math.max(0, (totals.available / totals.totalCapital) * 100) : 0,
    investedPercentage: totals.totalCapital > 0 ? Math.min(100, Math.max(0, (totals.invested / totals.totalCapital) * 100)) : 0,
    expectedReturn: totals.openCapital ? (totals.projectedProfit / totals.openCapital) * 100 : 0,
    setActiveCreditId,
    saveCredit,
    removeCredit,
    updateDraft,
    addInvestment,
    changeStatus,
    editInvestment,
    removeInvestment,
    duplicateInvestment,
    toggleInstallmentPaid,
  };
}
