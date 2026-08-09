import { AppTopbar } from "../components/app-topbar";

export default function FeedbackPage() {
  return (
    <main className="feedback-page">
      <AppTopbar />
      <section className="feedback-placeholder">
        <span>PRÓXIMAMENTE</span>
        <h1>Ayúdanos a mejorar</h1>
        <p>Este espacio estará disponible en una próxima actualización.</p>
      </section>
    </main>
  );
}
