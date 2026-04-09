import { useState } from "react";
import { formatMoney } from "../utils/formatters.js";

const TYPE_LABELS = {
  service: "Servicio",
  product: "Producto",
};

const INVENTORY_GROUPS = [
  { key: "service", title: "Servicios" },
  { key: "product", title: "Productos" },
];

const INITIAL_FORM = {
  editingId: "",
  name: "",
  type: "service",
  totalPrice: "",
  barberShare: "",
  shopShare: "",
};

function getFormFromItem(item) {
  if (!item) {
    return INITIAL_FORM;
  }

  return {
    editingId: item.name,
    name: item.name,
    type: item.type || "service",
    totalPrice: String(item.totalPrice ?? ""),
    barberShare: String(item.barberShare ?? ""),
    shopShare: String(item.shopShare ?? ""),
  };
}

export function InventoryScreen({
  inventory,
  loading,
  inventorySaving,
  deletingInventoryName,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const sortedItems = [...inventory].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const groupedItems = INVENTORY_GROUPS.map((group) => ({
    ...group,
    items: sortedItems.filter((item) => item.type === group.key),
  }));
  const isEditing = Boolean(form.editingId);
  const totalValue = Number(form.totalPrice || 0);
  const barberValue = Number(form.barberShare || 0);
  const shopValue = Number(form.shopShare || 0);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setIsFormVisible(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      editingId: form.editingId || undefined,
      name: form.name.trim(),
      type: form.type,
      totalPrice: Number(form.totalPrice || 0),
      barberShare: Number(form.barberShare || 0),
      shopShare: Number(form.shopShare || 0),
    };

    if (!payload.name) {
      return;
    }

    if (isEditing) {
      await onUpdateItem(payload);
    } else {
      await onAddItem(payload);
    }

    resetForm();
  }

  return (
    <section className="section-block screen-tail screen-start">
      <div className="section-heading">
        <h2>Inventario</h2>
        <span>{inventory.length} cargados</span>
      </div>

      <div className="action-row">
        <span className="helper-copy">
          {isEditing ? "Estas editando un item existente" : "Gestiona productos y servicios"}
        </span>
        <button
          type="button"
          className="primary-action"
          onClick={() => {
            if (isEditing) {
              resetForm();
              return;
            }

            setIsFormVisible((current) => !current);
          }}
        >
          {isEditing ? "Cancelar" : isFormVisible ? "Cerrar" : "+ Anadir"}
        </button>
      </div>

      <div
        style={{
          maxHeight: isFormVisible || isEditing ? "640px" : "0",
          opacity: isFormVisible || isEditing ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 240ms ease, opacity 180ms ease",
          marginTop: 12,
        }}
        aria-hidden={!isFormVisible && !isEditing}
      >
        <form className="editor-card" onSubmit={handleSubmit}>
          <label className="field-block">
            <span>Nombre</span>
            <input
              className="text-field"
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Ej. Corte premium"
              required
            />
          </label>

          <div className="form-grid">
            <label className="field-block">
              <span>Tipo</span>
              <select
                className="text-field"
                value={form.type}
                onChange={(event) => updateField("type", event.target.value)}
              >
                <option value="service">Servicio</option>
                <option value="product">Producto</option>
              </select>
            </label>

            <label className="field-block">
              <span>Precio total</span>
              <input
                className="text-field"
                type="number"
                min="0"
                step="0.01"
                value={form.totalPrice}
                onChange={(event) => updateField("totalPrice", event.target.value)}
                required
              />
            </label>
          </div>

          <div className="form-grid">
            <label className="field-block">
              <span>Parte barbero</span>
              <input
                className="text-field"
                type="number"
                min="0"
                step="0.01"
                value={form.barberShare}
                onChange={(event) => updateField("barberShare", event.target.value)}
                required
              />
            </label>

            <label className="field-block">
              <span>Parte local</span>
              <input
                className="text-field"
                type="number"
                min="0"
                step="0.01"
                value={form.shopShare}
                onChange={(event) => updateField("shopShare", event.target.value)}
                required
              />
            </label>
          </div>

          <div className="summary-strip">
            <span>Total {formatMoney(totalValue)}</span>
            <span>
              Reparto {formatMoney(barberValue)} / {formatMoney(shopValue)}
            </span>
          </div>

          <div className="action-row">
            {isEditing ? (
              <button type="button" className="ghost-action" onClick={resetForm}>
                Cancelar
              </button>
            ) : (
              <span className="helper-copy">Crea productos y servicios desde aqui</span>
            )}

            <button type="submit" className="primary-action" disabled={inventorySaving}>
              {inventorySaving ? "Guardando..." : isEditing ? "Guardar cambios" : "Anadir item"}
            </button>
          </div>
        </form>
      </div>

      <div className="section-heading section-heading-spaced">
        <h2>Items disponibles</h2>
        <span>Editar o eliminar</span>
      </div>

      <div className="stack-list">
        {groupedItems.map((group) =>
          group.items.length > 0 ? (
            <div key={group.key} className="stack-list">
              <div className="section-heading">
                <h2>{group.title}</h2>
                <span>{group.items.length} items</span>
              </div>

              {group.items.map((item) => (
                <article key={`${item.type}-${item.name}`} className="info-card info-card-tall">
                  <div className="inventory-item-button">
                    <div className="register-grid">
                      <div>
                        <strong>{item.name}</strong>
                        <p>{TYPE_LABELS[item.type] || item.type}</p>
                      </div>
                      <div className="register-meta">
                        <strong className="accent-amount">{formatMoney(item.totalPrice)}</strong>
                        <p>
                          {formatMoney(item.barberShare)} / {formatMoney(item.shopShare)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="action-row">
                    <span className="helper-copy">
                      {item.name === form.editingId ? "Editando" : ""}
                    </span>
                    <div className="inline-actions">
                      <button
                        type="button"
                        className="ghost-action"
                        onClick={() => {
                          setForm(getFormFromItem(item));
                          setIsFormVisible(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="danger-button subtle"
                        onClick={() => onDeleteItem(item)}
                        disabled={deletingInventoryName === item.name}
                      >
                        {deletingInventoryName === item.name ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null,
        )}

        {!loading && sortedItems.length === 0 ? (
          <div className="empty-state">No hay productos o servicios en Google Sheets.</div>
        ) : null}
      </div>
    </section>
  );
}
