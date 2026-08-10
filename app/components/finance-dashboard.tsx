"use client";

import { useFinanceDashboard } from "../finance/use-finance-dashboard";
import { BalanceFooter } from "./balance-footer";
import { AppTopbar } from "./app-topbar";
import { CapitalOverview } from "./capital-overview";
import { LoanPanel } from "./loan-panel";
import { Summary } from "./summary";
import { FinanceDataGate } from "./finance-data-gate";

export function FinanceDashboard() {
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
    <main>
      <AppTopbar />
      {finance.error && <p className="finance-api-error" role="alert">{finance.error}</p>}

      <section className="hero">
        <div>
          <p className="eyebrow">PANEL FINANCIERO</p>
          <h1>
            Gestiona,
            <br />
           controla y invierte
          </h1>
        </div>
        <p className="intro">
          Controla tu préstamo, distribuye el capital y mide la utilidad de cada
          inversión desde un solo lugar.
        </p>
      </section>

      <Summary
        remainingLoan={finance.totals.remainingLoan}
        months={finance.months}
        paidInstallments={finance.totals.paidCount}
        totalInstallments={finance.totals.totalInstallments}
        creditCount={finance.creditCount}
        available={finance.totals.available}
        availablePercentage={finance.availablePercentage}
        projectedProfit={finance.totals.projectedProfit}
        expectedReturn={finance.expectedReturn}
        currentBalance={finance.totals.currentBalance}
      />

      <div className="grid">
        <LoanPanel
          credits={finance.credits}
          activeCreditId={finance.activeCreditId}
          remainingRepayment={finance.activeCreditTotals.remainingRepayment}
          remainingInstallments={finance.activeCreditTotals.remainingInstallments}
          creditCommitments={finance.creditCommitments}
          onSelectCredit={finance.setActiveCreditId}
          onRemoveCredit={finance.removeCredit}
          onSaveCredit={finance.saveCredit}
        />
        <CapitalOverview
          totalCapital={finance.totals.totalCapital}
          available={finance.totals.available}
          invested={finance.totals.invested}
          projectedProfit={finance.totals.projectedProfit}
          currentBalance={finance.totals.currentBalance}
          openCount={finance.totals.open.length}
          closedCount={finance.totals.closed.length}
        />
      </div>

      <BalanceFooter
        currentBalance={finance.totals.currentBalance}
        invested={finance.totals.invested}
        totalCapital={finance.totals.totalCapital}
        investedPercentage={finance.investedPercentage}
      />
    </main>
  );
}
