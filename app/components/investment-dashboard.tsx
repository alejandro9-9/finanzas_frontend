"use client";

import { useFinanceDashboard } from "../finance/use-finance-dashboard";
import { AppTopbar } from "./app-topbar";
import { InvestmentsPanel } from "./investments-panel";

export function InvestmentDashboard() {
  const finance = useFinanceDashboard();

  return (
    <main className="investments-page">
      <AppTopbar />

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
