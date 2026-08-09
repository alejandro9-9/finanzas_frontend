export type UserStatus = "pendingEmailConfirmation" | "active" | "blocked";
export type CreditStatus = "active" | "completed" | "archived";
export type CreditInstallmentStatus = "pending" | "paid" | "overdue";
export type CapitalAccountType = "loan" | "creditCard" | "savings" | "person";
export type InvestmentStatus = "open" | "closed" | "archived";
export type Currency = "PEN" | "USD";

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  requiresEmailVerification: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface ResendEmailVerificationRequest {
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface MessageResponse {
  message: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreditResponse {
  id: string;
  userId: string;
  name: string;
  amount: number;
  numberOfInstallments: number;
  installmentAmount: number;
  firstDueDate: string;
  status: CreditStatus;
  createdAt: string;
  updatedAt: string;
}

export type SaveCreditRequest = Pick<
  CreditResponse,
  | "name"
  | "amount"
  | "numberOfInstallments"
  | "installmentAmount"
  | "firstDueDate"
>;

export interface CreditInstallmentResponse {
  id: string;
  creditId: string;
  number: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  paidAt: string | null;
  status: CreditInstallmentStatus;
}

export interface CapitalAccountResponse {
  id: string;
  userId: string;
  name: string;
  type: CapitalAccountType;
  currency: Currency;
  creditId: string | null;
  isActive: boolean;
  createdAt: string;
}

export type SaveCapitalAccountRequest = Pick<
  CapitalAccountResponse,
  "name" | "type" | "currency" | "creditId"
>;

export interface InvestmentResponse {
  id: string;
  userId: string;
  capitalAccountId: string;
  creditId: string | null;
  name: string;
  originalAmount: number;
  currency: Currency;
  exchangeRate: number;
  amountInSoles: number;
  projectedSalePrice: number;
  status: InvestmentStatus;
  createdAt: string;
  updatedAt: string;
}

export type SaveInvestmentRequest = Pick<
  InvestmentResponse,
  | "capitalAccountId"
  | "creditId"
  | "name"
  | "originalAmount"
  | "currency"
  | "exchangeRate"
  | "projectedSalePrice"
>;

export interface InvestmentAdditionalCostResponse {
  id: string;
  investmentId: string;
  capitalAccountId: string;
  creditId: string | null;
  description: string;
  originalAmount: number;
  currency: Currency;
  exchangeRate: number;
  amountInSoles: number;
  createdAt: string;
}

export type SaveInvestmentAdditionalCostRequest = Omit<
  InvestmentAdditionalCostResponse,
  "id" | "amountInSoles" | "createdAt"
>;

export interface FinanceSnapshot {
  credits: CreditResponse[];
  installmentsByCreditId: Record<string, CreditInstallmentResponse[]>;
  capitalAccounts: CapitalAccountResponse[];
  investments: InvestmentResponse[];
  additionalCostsByInvestmentId: Record<string, InvestmentAdditionalCostResponse[]>;
}

export interface ApiProblem {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
  message?: string;
}
