import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoanPanel } from "../../app/components/loan-panel";

describe("LoanPanel", () => {
  const credit = {
    id: "credit-1",
    name: "Préstamo BCP",
    loan: 8_000,
    months: 12,
    installments: 12,
    payment: 750,
    firstPaymentDate: "2026-09-05",
    paidInstallments: [],
  };

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

  it("allows editing an unpaid credit schedule", async () => {
    const user = userEvent.setup();
    const onSaveCredit = vi.fn().mockResolvedValue("saved");

    render(
      <LoanPanel
        credits={[credit]}
        activeCreditId={credit.id}
        remainingRepayment={9_000}
        remainingInstallments={12}
        creditCommitments={{ [credit.id]: 0 }}
        onSelectCredit={vi.fn()}
        onRemoveCredit={vi.fn().mockResolvedValue("deleted")}
        onSaveCredit={onSaveCredit}
      />,
    );

    await user.click(screen.getByRole("button", { name: `Editar ${credit.name}` }));

    const installmentsInput = screen.getByLabelText(/Número de cuotas/i);
    const paymentInput = screen.getByLabelText(/Valor de cada cuota/i);
    const dateInput = screen.getByLabelText(/Fecha de la primera cuota/i);
    expect(installmentsInput).toBeEnabled();
    expect(paymentInput).toBeEnabled();
    expect(dateInput).toBeEnabled();

    await user.clear(installmentsInput);
    await user.type(installmentsInput, "10");
    await user.clear(paymentInput);
    await user.type(paymentInput, "900");
    fireEvent.change(dateInput, { target: { value: "2026-10-05" } });
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(onSaveCredit).toHaveBeenCalledWith(credit.id, {
      name: credit.name,
      loan: credit.loan,
      months: 10,
      installments: 10,
      payment: 900,
      firstPaymentDate: "2026-10-05",
    });
  });

  it("protects the schedule after a payment was registered", async () => {
    const user = userEvent.setup();

    render(
      <LoanPanel
        credits={[{ ...credit, paidInstallments: [1] }]}
        activeCreditId={credit.id}
        remainingRepayment={8_250}
        remainingInstallments={11}
        creditCommitments={{ [credit.id]: 0 }}
        onSelectCredit={vi.fn()}
        onRemoveCredit={vi.fn().mockResolvedValue("deleted")}
        onSaveCredit={vi.fn().mockResolvedValue("saved")}
      />,
    );

    await user.click(screen.getByRole("button", { name: `Editar ${credit.name}` }));

    expect(screen.getByLabelText(/Número de cuotas/i)).toBeDisabled();
    expect(screen.getByLabelText(/Valor de cada cuota/i)).toBeDisabled();
    expect(screen.getByLabelText(/Fecha de la primera cuota/i)).toBeDisabled();
    expect(
      screen.getByText("El calendario no puede modificarse porque ya tiene cuotas pagadas."),
    ).toBeInTheDocument();
  });
});
