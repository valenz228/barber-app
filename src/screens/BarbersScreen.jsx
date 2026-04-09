import { useState } from "react";
import { formatMoney, getAvatarLabel } from "../utils/formatters.js";

const INITIAL_FORM = {
  editingId: "",
  name: "",
  photo: "",
};

function getFormFromBarber(barber) {
  if (!barber) {
    return INITIAL_FORM;
  }

  return {
    editingId: barber.name,
    name: barber.name,
    photo: barber.photo || "",
  };
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));

    reader.readAsDataURL(file);
  });
}

export function BarbersScreen({
  barbers,
  sales,
  loading,
  barberSaving,
  deletingBarberName,
  onAddBarber,
  onUpdateBarber,
  onDeleteBarber,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [localError, setLocalError] = useState("");
  const [selectedBarber, setSelectedBarber] = useState(null);

  const sortedBarbers = [...barbers].sort((a, b) => a.name.localeCompare(b.name, "es"));
  const isEditing = Boolean(form.editingId);
  const activeBarberName = selectedBarber?.name || "";
  const activeBarber = sortedBarbers.find((barber) => barber.name === activeBarberName) || null;

  const now = new Date();
  const currentMonthSales = sales.filter((sale) => {
    if (!activeBarberName || sale.barberName !== activeBarberName || !sale.date) {
      return false;
    }

    const saleDate = new Date(sale.date);

    return (
      !Number.isNaN(saleDate.getTime()) &&
      saleDate.getMonth() === now.getMonth() &&
      saleDate.getFullYear() === now.getFullYear()
    );
  });

  const totalGenerated = currentMonthSales.reduce(
    (sum, sale) => sum + Number(sale.totalPrice || 0),
    0,
  );
  const barberEarnings = currentMonthSales.reduce(
    (sum, sale) => sum + Number(sale.barberShare || 0),
    0,
  );
  const shopEarnings = currentMonthSales.reduce(
    (sum, sale) => sum + Number(sale.shopShare || 0),
    0,
  );
  const totalServices = currentMonthSales.length;
  const averageTicket = totalServices > 0 ? totalGenerated / totalServices : 0;

  function updateField(field, value) {
    setLocalError("");
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const base64Image = await readFileAsBase64(file);
      updateField("photo", base64Image);
    } catch (error) {
      setLocalError(error.message);
    } finally {
      event.target.value = "";
    }
  }

  function resetForm() {
    setLocalError("");
    setForm(INITIAL_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedName = form.name.trim();
    const duplicateExists = barbers.some((barber) => {
      const sameName = barber.name.trim().toLowerCase() === normalizedName.toLowerCase();
      const sameEditingTarget = isEditing && barber.name === form.editingId;

      return sameName && !sameEditingTarget;
    });

    if (!normalizedName) {
      return;
    }

    if (duplicateExists) {
      setLocalError("Ya existe un barbero con ese nombre.");
      return;
    }

    const payload = {
      editingId: form.editingId || undefined,
      name: normalizedName,
      photo: form.photo.trim(),
    };

    if (isEditing) {
      await onUpdateBarber(payload);
    } else {
      await onAddBarber(payload);
    }

    resetForm();
  }

  return (
    <section className="section-block screen-tail screen-start">
      <div className="section-heading">
        <h2>{isEditing ? "Editar barbero" : "Nuevo barbero"}</h2>
        <span>{barbers.length} perfiles</span>
      </div>

      <form className="editor-card" onSubmit={handleSubmit}>
        <label className="field-block">
          <span>Nombre</span>
          <input
            className="text-field"
            type="text"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Ej. Jandri"
            required
          />
        </label>

        <label className="field-block">
          <span>Foto opcional</span>
          <input
            className="text-field file-field"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          <span className="helper-copy">
            {form.photo ? "Imagen cargada correctamente" : "Selecciona una imagen del dispositivo"}
          </span>
        </label>

        {localError ? <div className="inline-error">{localError}</div> : null}

        <div className="action-row">
          {isEditing ? (
            <button type="button" className="ghost-action" onClick={resetForm}>
              Cancelar
            </button>
          ) : (
            <span className="helper-copy">La foto es opcional</span>
          )}

          <button type="submit" className="primary-action" disabled={barberSaving}>
            {barberSaving ? "Guardando..." : isEditing ? "Guardar cambios" : "Anadir barbero"}
          </button>
        </div>
      </form>

      <div className="section-heading section-heading-spaced">
        <h2>Equipo</h2>
        <span>Toca para ver detalle</span>
      </div>

      <div className="stack-list">
        {sortedBarbers.map((barber) => (
          <article
            key={barber.name}
            className="info-card info-card-tall clickable-card"
            onClick={() => setSelectedBarber(barber)}
          >
            <div className="profile-block">
              <span className="chip-avatar profile-avatar">
                {barber.photo ? (
                  <img src={barber.photo} alt={barber.name} />
                ) : (
                  getAvatarLabel(barber.name)
                )}
              </span>

              <div>
                <strong>{barber.name}</strong>
                <p>{barber.photo ? "Con foto" : "Sin foto"}</p>
              </div>
            </div>

            <div className="action-row">
              <span className="helper-copy">{barber.name === form.editingId ? "Editando" : ""}</span>
              <div className="inline-actions">
                <button
                  type="button"
                  className="ghost-action"
                  onClick={(event) => {
                    event.stopPropagation();
                    setForm(getFormFromBarber(barber));
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="danger-button subtle"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteBarber(barber);
                  }}
                  disabled={deletingBarberName === barber.name}
                >
                  {deletingBarberName === barber.name ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </article>
        ))}

        {!loading && sortedBarbers.length === 0 ? (
          <div className="empty-state">No hay barberos registrados en Google Sheets.</div>
        ) : null}
      </div>

      {activeBarber ? (
        <div className="bottom-sheet-overlay" onClick={() => setSelectedBarber(null)}>
          <section
            className="bottom-sheet"
            onClick={(event) => event.stopPropagation()}
            aria-label={`Detalle de ${activeBarber.name}`}
          >
            <div className="bottom-sheet-handle" aria-hidden="true" />

            <div className="bottom-sheet-header">
              <div className="profile-block">
                <span className="chip-avatar profile-avatar">
                  {activeBarber.photo ? (
                    <img src={activeBarber.photo} alt={activeBarber.name} />
                  ) : (
                    getAvatarLabel(activeBarber.name)
                  )}
                </span>
                <div>
                  <strong>{activeBarber.name}</strong>
                  <p>Resumen del mes actual</p>
                </div>
              </div>

              <button
                type="button"
                className="ghost-action"
                onClick={() => setSelectedBarber(null)}
              >
                Cerrar
              </button>
            </div>

            <div className="stats-grid">
              <article className="stat-card">
                <span>Total generado</span>
                <strong>{formatMoney(totalGenerated)}</strong>
              </article>
              <article className="stat-card">
                <span>Gana barbero</span>
                <strong>{formatMoney(barberEarnings)}</strong>
              </article>
              <article className="stat-card">
                <span>Gana local</span>
                <strong>{formatMoney(shopEarnings)}</strong>
              </article>
              <article className="stat-card">
                <span>Servicios</span>
                <strong>{totalServices}</strong>
              </article>
              <article className="stat-card stat-card-wide">
                <span>Ticket medio</span>
                <strong>{formatMoney(averageTicket)}</strong>
              </article>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
