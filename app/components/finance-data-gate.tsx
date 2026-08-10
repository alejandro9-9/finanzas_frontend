import { AppTopbar } from "./app-topbar";

type FinanceDataGateProps = {
  isLoading: boolean;
  error: string;
  onRetry: () => void;
};

export function FinanceDataGate({
  isLoading,
  error,
  onRetry,
}: FinanceDataGateProps) {
  return (
    <main>
      <AppTopbar />
      <section className="finance-data-gate" role={isLoading ? "status" : "alert"}>
        <span aria-hidden="true">{isLoading ? "…" : "!"}</span>
        <p className="eyebrow">CONEXIÓN CON EL BACKEND</p>
        <h1>{isLoading ? "Cargando tus finanzas" : "No podemos cargar tus datos"}</h1>
        <p>
          {isLoading
            ? "Estamos consultando la información guardada en tu cuenta."
            : error || "El backend no está disponible en este momento."}
        </p>
        {!isLoading && (
          <button type="button" onClick={onRetry}>
            Reintentar conexión
          </button>
        )}
      </section>
    </main>
  );
}
