import { formatDate, formatMoney, getAvatarLabel } from "../utils/formatters.js";

const CATEGORY_LABELS = {
  service: "Servicio",
  product: "Producto",
};

export function SalesScreen({
  category,
  setCategory,
  selectedBarber,
  setSelectedBarber,
  selectedItem,
  setSelectedItem,
  quantity,
  setQuantity,
  barbers,
  sales,
  visibleItems,
  activeBarber,
  activeItem,
  editingSaleId,
  submitSuccess,
  refreshing,
  loading,
  onCancelEditSale,
  onStartEditSale,
  onRefresh,
}) {
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  const totalPrice = Number(activeItem?.totalPrice || 0) * quantity;
  const barberShare = Number(activeItem?.barberShare || 0) * quantity;
  const shopShare = Number(activeItem?.shopShare || 0) * quantity;

  return (
    <>
      <section className="hero-card">
        <div>
          <p className="hero-label">Barbero activo</p>
          <strong>{activeBarber?.name || "Sin seleccionar"}</strong>
        </div>

        <button
          type="button"
          className="ghost-button"
          onClick={onRefresh}
          disabled={refreshing || loading}
        >
          {refreshing ? "Actualizando..." : "Actualizar"}
        </button>
      </section>

      <section className="section-block">
        <div className="segmented-control" role="tablist" aria-label="Tipo de venta">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`segment ${category === key ? "active" : ""}`}
              onClick={() => setCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Selecciona barbero</h2>
          <span>{barbers.length} disponibles</span>
        </div>

        <div className="chips-grid">
          {barbers.map((barber) => (
            <button
              key={barber.name}
              type="button"
              className={`chip-card ${selectedBarber === barber.name ? "selected" : ""}`}
              onClick={() => setSelectedBarber(barber.name)}
            >
              <span className="chip-avatar">
                {barber.photo ? (
                  <img src={barber.photo} alt={barber.name} />
                ) : (
                  getAvatarLabel(barber.name)
                )}
              </span>
              <span>{barber.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>{CATEGORY_LABELS[category]}</h2>
          <span>{visibleItems.length} items</span>
        </div>

        <div className="items-list">
          {visibleItems.map((item) => {
            const isSelected = selectedItem === item.name;

            return (
              <button
                key={`${item.type}-${item.name}`}
                type="button"
                className={`item-card ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedItem(item.name)}
              >
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    Barbero {formatMoney(item.barberShare)} · Local {formatMoney(item.shopShare)}
                  </p>
                </div>
                <span>{formatMoney(item.totalPrice)}</span>
              </button>
            );
          })}

          {!loading && visibleItems.length === 0 ? (
            <div className="empty-state">
              No hay {CATEGORY_LABELS[category].toLowerCase()}s cargados en Google Sheets.
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Cantidad</h2>
          <span>Ajusta la venta</span>
        </div>

        <div className="quantity-card">
          <button
            type="button"
            className="stepper-button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={!activeItem}
          >
            -
          </button>
          <div className="quantity-value">{quantity}</div>
          <button
            type="button"
            className="stepper-button"
            onClick={() => setQuantity((current) => current + 1)}
            disabled={!activeItem}
          >
            +
          </button>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>Resumen</h2>
          <span>{editingSaleId ? "Modo edicion" : activeItem?.name || "Sin item"}</span>
        </div>

        <div className="summary-card">
          {editingSaleId ? (
            <div className="edit-banner">
              <span>Editando venta existente</span>
              <button type="button" className="ghost-action" onClick={onCancelEditSale}>
                Cancelar
              </button>
            </div>
          ) : null}
          {submitSuccess ? <div className="inline-success">{submitSuccess}</div> : null}
          <div className="summary-row">
            <span>Total</span>
            <strong>{formatMoney(totalPrice)}</strong>
          </div>
          <div className="summary-row">
            <span>Parte barbero</span>
            <strong>{formatMoney(barberShare)}</strong>
          </div>
          <div className="summary-row">
            <span>Parte local</span>
            <strong>{formatMoney(shopShare)}</strong>
          </div>
          <div className="summary-row emphasis">
            <span>Total actual x{quantity}</span>
            <strong>{formatMoney(totalPrice)}</strong>
          </div>
        </div>
      </section>

      <section className="section-block screen-tail">
        <div className="section-heading">
          <h2>Ultimas ventas</h2>
          <span>Desde Sheets</span>
        </div>

        <div className="sales-list">
          {recentSales.map((sale, index) => (
            <article key={`${sale.itemName}-${sale.date}-${index}`} className="sale-card">
              <div>
                <strong>{sale.itemName}</strong>
                <p>
                  {sale.barberName} · {sale.quantity} uds
                </p>
              </div>
              <div className="sale-meta">
                <strong>{formatMoney(sale.totalPrice)}</strong>
                <span>{formatDate(sale.date)}</span>
              </div>
              <button
                type="button"
                className="ghost-action sale-edit-button"
                onClick={() => onStartEditSale(sale)}
              >
                Editar
              </button>
            </article>
          ))}

          {!loading && recentSales.length === 0 ? (
            <div className="empty-state">Todavia no hay ventas registradas.</div>
          ) : null}
        </div>
      </section>
    </>
  );
}
