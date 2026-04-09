import { useMemo, useState } from "react";
import { formatDate, formatMoney } from "../utils/formatters.js";

function normalizeBarberName(value) {
  return (value || "").trim().toLowerCase();
}

export function RegisterScreen({
  sales,
  loading,
  deletingSaleKey,
  onDeleteSale,
  onEditSale,
}) {
  const [selectedBarber, setSelectedBarber] = useState("all");

  const barberOptions = useMemo(
    () =>
      [
        ...new Map(
          sales
            .map((sale) => sale.barberName?.trim())
            .filter(Boolean)
            .map((barberName) => [normalizeBarberName(barberName), barberName]),
        ).values(),
      ].sort((a, b) => a.localeCompare(b, "es")),
    [sales],
  );

  const sortedSales = useMemo(
    () =>
      [...sales]
        .filter((sale) => {
          if (selectedBarber === "all") {
            return true;
          }

          return normalizeBarberName(sale.barberName) === normalizeBarberName(selectedBarber);
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [sales, selectedBarber],
  );

  return (
    <section className="section-block screen-tail screen-start">
      <div className="section-heading">
        <h2>Historial de ventas</h2>
        <span>{sortedSales.length} registros</span>
      </div>

      <div className="editor-card compact-card">
        <label className="field-block">
          <span>Filtrar por barbero</span>
          <select
            className="text-field"
            value={selectedBarber}
            onChange={(event) => setSelectedBarber(event.target.value)}
          >
            <option value="all">Todos</option>
            {barberOptions.map((barberName) => (
              <option key={barberName} value={barberName}>
                {barberName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stack-list register-list-spaced">
        {sortedSales.map((sale, index) => {
          const saleKey = sale.id || `${sale.itemName}-${sale.barberName}-${sale.date}`;

          return (
            <article key={`${saleKey}-${index}`} className="info-card info-card-tall">
              <div className="register-grid">
                <div>
                  <strong>{sale.itemName}</strong>
                  <p>{sale.barberName}</p>
                </div>

                <div className="register-meta">
                  <strong className="accent-amount">{formatMoney(sale.totalPrice)}</strong>
                  <p>{formatDate(sale.date)}</p>
                </div>
              </div>

              <div className="inline-actions register-actions">
                <button type="button" className="ghost-action" onClick={() => onEditSale(sale)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="danger-button subtle"
                  onClick={() => onDeleteSale(sale)}
                  disabled={deletingSaleKey === saleKey}
                >
                  {deletingSaleKey === saleKey ? "Eliminando..." : "Eliminar venta"}
                </button>
              </div>
            </article>
          );
        })}

        {!loading && sales.length === 0 ? (
          <div className="empty-state">Todavia no hay ventas registradas en Google Sheets.</div>
        ) : null}

        {!loading && sales.length > 0 && sortedSales.length === 0 ? (
          <div className="empty-state">No hay ventas para el barbero seleccionado.</div>
        ) : null}
      </div>
    </section>
  );
}
