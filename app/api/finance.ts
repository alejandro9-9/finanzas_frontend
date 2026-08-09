import { apiRequest } from "./client";
import type {
  CapitalAccountResponse,
  CreditInstallmentResponse,
  CreditResponse,
  FinanceSnapshot,
  InvestmentAdditionalCostResponse,
  InvestmentResponse,
  SaveCapitalAccountRequest,
  SaveCreditRequest,
  SaveInvestmentAdditionalCostRequest,
  SaveInvestmentRequest,
} from "./contracts";

const json = (body: unknown): RequestInit => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const financeApi = {
  getCredits: () => apiRequest<CreditResponse[]>("/api/credits"),
  createCredit: (request: SaveCreditRequest) =>
    apiRequest<string>("/api/credits", { method: "POST", ...json(request) }),
  updateCredit: (id: string, request: SaveCreditRequest) =>
    apiRequest<string>(`/api/credits/${id}`, { method: "PUT", ...json(request) }),
  archiveCredit: (id: string) =>
    apiRequest<string>(`/api/credits/${id}`, { method: "DELETE" }),
  getInstallments: (creditId: string) =>
    apiRequest<CreditInstallmentResponse[]>(`/api/creditinstallments/credit/${creditId}`),
  payInstallment: (id: string, amount: number) =>
    apiRequest<string>(`/api/creditinstallments/${id}/payments`, { method: "POST", ...json({ amount }) }),
  getCapitalAccounts: () => apiRequest<CapitalAccountResponse[]>("/api/capitalaccounts"),
  createCapitalAccount: (request: SaveCapitalAccountRequest) =>
    apiRequest<string>("/api/capitalaccounts", { method: "POST", ...json(request) }),
  updateCapitalAccount: (id: string, request: SaveCapitalAccountRequest) =>
    apiRequest<string>(`/api/capitalaccounts/${id}`, { method: "PUT", ...json(request) }),
  getInvestments: () => apiRequest<InvestmentResponse[]>("/api/investments"),
  createInvestment: (request: SaveInvestmentRequest) =>
    apiRequest<string>("/api/investments", { method: "POST", ...json(request) }),
  updateInvestment: (id: string, request: SaveInvestmentRequest) =>
    apiRequest<string>(`/api/investments/${id}`, { method: "PUT", ...json(request) }),
  closeInvestment: (id: string) =>
    apiRequest<string>(`/api/investments/${id}/close`, { method: "POST" }),
  reopenInvestment: (id: string) =>
    apiRequest<string>(`/api/investments/${id}/reopen`, { method: "POST" }),
  getAdditionalCosts: (investmentId: string) =>
    apiRequest<InvestmentAdditionalCostResponse[]>(`/api/investmentadditionalcosts/investment/${investmentId}`),
  createAdditionalCost: (request: SaveInvestmentAdditionalCostRequest) =>
    apiRequest<string>("/api/investmentadditionalcosts", { method: "POST", ...json(request) }),
};

export async function loadFinanceSnapshot(): Promise<FinanceSnapshot> {
  const [credits, capitalAccounts, investments] = await Promise.all([
    financeApi.getCredits(),
    financeApi.getCapitalAccounts(),
    financeApi.getInvestments(),
  ]);

  const [installmentEntries, additionalCostEntries] = await Promise.all([
    Promise.all(
      credits.map(async (credit) => [
        credit.id,
        await financeApi.getInstallments(credit.id),
      ] as const),
    ),
    Promise.all(
      investments.map(async (investment) => [
        investment.id,
        await financeApi.getAdditionalCosts(investment.id),
      ] as const),
    ),
  ]);

  return {
    credits,
    capitalAccounts,
    investments,
    installmentsByCreditId: Object.fromEntries(installmentEntries),
    additionalCostsByInvestmentId: Object.fromEntries(additionalCostEntries),
  };
}
