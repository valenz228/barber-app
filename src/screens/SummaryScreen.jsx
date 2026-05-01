import { formatMoney } from "../utils/formatters.js";
import { calculateSummaryTotals, getBarberSummaryRows } from "../utils/summary.js";

export function SummaryScreen({ sales, barbers, loading }) {
  const summary = calculateSummaryTotals(sales);
  const barberRows = getBarberSummaryRows(sales, barbers);

  return (
    <section className="section-block screen-tail screen-start">
      <div className="section-heading">
        <h2>Resumen general</h2>
        <span>{sales.length} ventas registradas</span>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Total generado</span>
          <strong>{formatMoney(summary.totalGenerated)}</strong>
        </article>
        <article className="stat-card">
          <span>Total de servicios</span>
          <strong>{summary.totalServices}</strong>
        </article>
        <article className="stat-card">
          <span>Productos vendidos</span>
          <strong>{summary.totalProducts}</strong>
        </article>
        <article className="stat-card">
          <span>Ingresos por productos</span>
          <strong>{formatMoney(summary.productRevenue)}</strong>
        </article>
      </div>

      <section className="section-block">
        <div className="section-heading">
          <h2>Totales por barbero</h2>
          <span>{barberRows.length} perfiles</span>
        </div>

        <div className="stack-list">
          {barberRows.map((row) => (
            <article key={row.barberName} className="info-card">
              <div>
                <strong>{row.barberName}</strong>
                <p>Ventas acumuladas</p>
              </div>
              <strong className="accent-amount">{formatMoney(row.totalGenerated)}</strong>
            </article>
          ))}

          {!loading && barberRows.length === 0 ? (
            <div className="empty-state">Todavia no hay datos suficientes para mostrar el resumen.</div>
          ) : null}
        </div>
      </section>
    </section>
  );
}
