import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoanPanel } from "../../app/components/loan-panel";

describe("LoanPanel", () => {
  it("keeps the number of installments entered for a new credit", async () => {
    const user = userEvent.setup();

    render(
      <LoanPanel
        credits={[]}
        activeCreditId={null}
        remainingRepayment={0}
        remainingInstallments={0}
        creditCommitments={{}}
        onSelectCredit={vi.fn()}
        onRemoveCredit={vi.fn().mockResolvedValue("deleted")}
        onSaveCredit={vi.fn().mockResolvedValue("saved")}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Agregar pr.stamo/i }));
    const installmentsInput = screen.getByLabelText(/N.mero de cuotas/i);
    await user.type(installmentsInput, "12");

    expect(installmentsInput).toHaveValue(12);
  });

  it("shows the correct validation when the credit name is empty", async () => {
    const user = userEvent.setup();
    const onSaveCredit = vi.fn().mockResolvedValue("saved");

    render(
      <LoanPanel
        credits={[]}
        activeCreditId={null}
        remainingRepayment={0}
        remainingInstallments={0}
        creditCommitments={{}}
        onSelectCredit={vi.fn()}
        onRemoveCredit={vi.fn().mockResolvedValue("deleted")}
        onSaveCredit={onSaveCredit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Agregar pr.stamo/i }));
    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }));

    expect(screen.getByText("Ingresa un nombre para el crédito.")).toBeInTheDocument();
    expect(onSaveCredit).not.toHaveBeenCalled();
  });
});
