import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFinanceDashboard } from "../../app/finance/use-finance-dashboard";
import { CreditDashboard } from "../../app/components/credit-dashboard";

vi.mock("../../app/finance/use-finance-dashboard", () => ({
  useFinanceDashboard: vi.fn(),
}));
vi.mock("../../app/components/app-topbar", () => ({ AppTopbar: () => null }));
vi.mock("../../app/components/finance-data-gate", () => ({ FinanceDataGate: () => null }));

describe("CreditDashboard", () => {
  const saveCredit = vi.fn().mockResolvedValue("saved");

  beforeEach(() => {
    vi.mocked(useFinanceDashboard).mockReturnValue({
      hasLoaded: true,
      isLoading: false,
      error: "",
      refresh: vi.fn(),
      credits: [{ id: "credit-1", name: "Préstamo", loan: 3000 }],
      activeCreditId: "credit-1",
      setActiveCreditId: vi.fn(),
      loan: 3000,
      activeCreditTotals: {
        repayment: 3400,
        cost: 400,
        remainingRepayment: 3400,
        paidAmount: 0,
        paymentProgress: 0,
      },
      paidInstallments: [],
      paymentSchedule: [],
      toggleInstallmentPaid: vi.fn(),
      saveCredit,
    } as unknown as ReturnType<typeof useFinanceDashboard>);
  });

  it("opens the new-credit dialog in the credit page", async () => {
    const user = userEvent.setup();
    render(<CreditDashboard />);

    await user.click(screen.getByRole("button", { name: /Nuevo crédito/i }));

    expect(screen.getByRole("dialog", { name: "Registrar crédito" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del crédito")).toHaveFocus();
  });
});
