"use client";

import { useFinanceDashboard } from "../finance/use-finance-dashboard";
import { AppTopbar } from "./app-topbar";
import { InvestmentsPanel } from "./investments-panel";
import { FinanceDataGate } from "./finance-data-gate";

export function InvestmentDashboard() {
  const finance = useFinanceDashboard();

  if (!finance.hasLoaded) {
    return (
      <FinanceDataGate
        isLoading={finance.isLoading}
        error={finance.error}
        onRetry={() => void finance.refresh()}
      />
    );
  }

  return (
    <main className="investments-page">
      <AppTopbar />
      {finance.error && <p className="finance-api-error" role="alert">{finance.error}</p>}

      <section className="investments-page-hero">
        <div>
          <p className="eyebrow">MIS INVERSIONES</p>
          <h1>
            Tu capital,
            <br />
            siempre en movimiento.
          </h1>
        </div>
        <p>
          Registra nuevas operaciones, revisa su rendimiento y controla cuánto
          capital tienes disponible para volver a invertir.
        </p>
      </section>

      <InvestmentsPanel
        credits={finance.credits}
        activeCreditId={finance.activeCreditId}
        investments={finance.investments}
        open={finance.totals.open}
        closed={finance.totals.closed}
        available={finance.totals.available}
        draft={finance.draft}
        onDraftChange={finance.updateDraft}
        onAdd={finance.addInvestment}
        onClose={(id) => finance.changeStatus(id, "closed")}
        onReopen={(id) => finance.changeStatus(id, "open")}
        onEdit={finance.editInvestment}
        onRemove={finance.removeInvestment}
        onDuplicate={finance.duplicateInvestment}
      />
    </main>
  );
}
