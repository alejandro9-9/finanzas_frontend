export type InvestmentStatus = "open" | "closed";
export type Currency = "PEN" | "USD";
export type CapitalSource = "loan" | "card" | "savings" | "person";

export type Credit = {
  id: string;
  name: string;
  loan: number;
  months: number;
  installments: number;
  payment: number;
  firstPaymentDate: string;
  paidInstallments: number[];
};

export type CreditChanges = Pick<
  Credit,
  | "name"
  | "loan"
  | "months"
  | "installments"
  | "payment"
  | "firstPaymentDate"
>;

export type AdditionalCost = {
  id: string | null;
  capitalAccountId?: string;
  name: string;
  amount: number;
  currency: Currency;
  exchangeRate: number;
  capitalSource: CapitalSource;
  creditId?: string;
};

export type Investment = {
  id: string;
  capitalAccountId?: string;
  name: string;
  amount: number;
  salePricePen: number;
  currency: Currency;
  exchangeRate: number;
  capitalSource: CapitalSource;
  creditId?: string;
  additionalCosts: AdditionalCost[];
  status: InvestmentStatus;
};

export type InvestmentValues = Pick<
  Investment,
  | "name"
  | "amount"
  | "salePricePen"
  | "currency"
  | "exchangeRate"
  | "capitalSource"
  | "creditId"
  | "additionalCosts"
>;

export type InvestmentDraft = {
  name: string;
  amount: string;
  salePricePen: string;
  currency: Currency;
  exchangeRate: string;
  capitalSource: CapitalSource;
  creditId: string | null;
  additionalCosts: AdditionalCost[];
};

export type LoanPayment = {
  id: string;
  number: number;
  date: Date;
  amount: number;
};
