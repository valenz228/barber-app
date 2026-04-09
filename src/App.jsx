import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { TabBar } from "./components/TabBar.jsx";
import { BarbersScreen } from "./screens/BarbersScreen.jsx";
import { InventoryScreen } from "./screens/InventoryScreen.jsx";
import { RegisterScreen } from "./screens/RegisterScreen.jsx";
import { SalesScreen } from "./screens/SalesScreen.jsx";
import {
  addBarber,
  addInventoryItem,
  createSale,
  deleteBarber,
  deleteInventoryItem,
  deleteSale,
  fetchSheetData,
  getErrorMessage,
  updateSale,
  updateBarber,
  updateInventoryItem,
} from "./services/sheetsApi.js";

const TABS = [
  { key: "sales", label: "Ventas", icon: "€" },
  { key: "inventory", label: "Inventario", icon: "▣" },
  { key: "barbers", label: "Barberos", icon: "✂" },
  { key: "register", label: "Registro", icon: "≡" },
];

function getSaleKey(sale) {
  return sale.id || `${sale.itemName}-${sale.barberName}-${sale.date}`;
}

function App() {
  const [currentTab, setCurrentTab] = useState("sales");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [barberSaving, setBarberSaving] = useState(false);
  const [inventorySaving, setInventorySaving] = useState(false);
  const [deletingBarberName, setDeletingBarberName] = useState("");
  const [deletingInventoryName, setDeletingInventoryName] = useState("");
  const [deletingSaleKey, setDeletingSaleKey] = useState("");

  const [inventory, setInventory] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [sales, setSales] = useState([]);

  const [category, setCategory] = useState("service");
  const [selectedBarber, setSelectedBarber] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [editingSaleId, setEditingSaleId] = useState("");
  const [editingSaleDate, setEditingSaleDate] = useState("");
  const initialLoadGuardRef = useRef(false);
  const saveSaleGuardRef = useRef(false);

  const visibleItems = useMemo(
    () => inventory.filter((item) => item.type === category),
    [inventory, category],
  );
  const activeBarber = barbers.find((barber) => barber.name === selectedBarber) || null;
  const activeItem = visibleItems.find((item) => item.name === selectedItem) || null;

  async function loadData(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await fetchSheetData();
      setInventory(data.inventory);
      setBarbers(data.barbers);
      setSales(data.sales);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (initialLoadGuardRef.current) {
      return;
    }

    initialLoadGuardRef.current = true;
    loadData();
  }, []);

  useEffect(() => {
    if (!submitSuccess) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSubmitSuccess("");
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [submitSuccess]);

  useEffect(() => {
    if (!selectedBarber && barbers.length > 0) {
      setSelectedBarber(barbers[0].name);
    }

    if (selectedBarber && !barbers.some((barber) => barber.name === selectedBarber)) {
      setSelectedBarber(barbers[0]?.name || "");
    }
  }, [barbers, selectedBarber]);

  useEffect(() => {
    const matchingItems = inventory.filter((item) => item.type === category);

    if (!matchingItems.some((item) => item.name === selectedItem)) {
      setSelectedItem(matchingItems[0]?.name || "");
      setQuantity(1);
    }
  }, [category, inventory, selectedItem]);

  function clearFeedback() {
    setSubmitError("");
    setSubmitSuccess("");
  }

  function resetSalesSelection() {
    setEditingSaleId("");
    setEditingSaleDate("");
    setSelectedItem("");
    setQuantity(1);
  }

  function buildSalePayload() {
    if (!activeItem || !activeBarber) {
      return null;
    }

    const totalPrice = Number(activeItem.totalPrice || 0) * quantity;
    const barberShare = Number(activeItem.barberShare || 0) * quantity;
    const shopShare = Number(activeItem.shopShare || 0) * quantity;
    const persistedId = editingSaleId || Date.now().toString();
    const persistedDate = editingSaleDate || new Date().toISOString();

    return {
      id: persistedId,
      itemName: activeItem.name,
      type: activeItem.type,
      quantity,
      totalPrice,
      barberShare,
      shopShare,
      barberName: activeBarber.name,
      date: persistedDate,
    };
  }

  async function handleSaveSale() {
    if (!activeItem || !activeBarber || submitting || saveSaleGuardRef.current) {
      return;
    }

    saveSaleGuardRef.current = true;
    clearFeedback();
    setSubmitting(true);

    try {
      const payload = buildSalePayload();

      if (!payload) {
        return;
      }

      if (editingSaleId) {
        await updateSale(payload);
        setSubmitSuccess("Venta actualizada");
        resetSalesSelection();
        await loadData(true);
      } else {
        await createSale(payload);
        resetSalesSelection();
        setSubmitSuccess("Venta guardada");
        await loadData(true);
      }
    } catch (saveError) {
      setSubmitError(getErrorMessage(saveError));
    } finally {
      saveSaleGuardRef.current = false;
      setSubmitting(false);
    }
  }

  function handleStartEditSale(sale) {
    clearFeedback();
    setEditingSaleId(sale.id || sale.date);
    setEditingSaleDate(sale.date);
    setCategory(sale.type);
    setSelectedItem(sale.itemName);
    setSelectedBarber(sale.barberName);
    setQuantity(Number(sale.quantity) || 1);
    setCurrentTab("sales");
  }

  async function handleAddBarber(barber) {
    clearFeedback();
    setBarberSaving(true);

    try {
      await addBarber(barber);
      setSubmitSuccess(`Barbero ${barber.name} creado.`);
      await loadData(true);
    } catch (barberError) {
      setSubmitError(getErrorMessage(barberError));
      throw barberError;
    } finally {
      setBarberSaving(false);
    }
  }

  async function handleUpdateBarber(barber) {
    clearFeedback();
    setBarberSaving(true);

    try {
      await updateBarber(barber);
      setSubmitSuccess(`Barbero ${barber.name} actualizado.`);
      await loadData(true);
    } catch (barberError) {
      setSubmitError(getErrorMessage(barberError));
      throw barberError;
    } finally {
      setBarberSaving(false);
    }
  }

  async function handleDeleteBarber(barber) {
    if (!barber?.name || deletingBarberName) {
      return;
    }

    clearFeedback();
    setDeletingBarberName(barber.name);

    try {
      await deleteBarber({ id: barber.name });
      setSubmitSuccess(`Barbero ${barber.name} eliminado.`);
      await loadData(true);
    } catch (deleteError) {
      setSubmitError(getErrorMessage(deleteError));
    } finally {
      setDeletingBarberName("");
    }
  }

  async function handleAddInventoryItem(item) {
    clearFeedback();
    setInventorySaving(true);

    try {
      await addInventoryItem(item);
      setSubmitSuccess(`Item ${item.name} creado.`);
      await loadData(true);
    } catch (inventoryError) {
      setSubmitError(getErrorMessage(inventoryError));
      throw inventoryError;
    } finally {
      setInventorySaving(false);
    }
  }

  async function handleUpdateInventoryItem(item) {
    clearFeedback();
    setInventorySaving(true);

    try {
      await updateInventoryItem(item);
      setSubmitSuccess(`Item ${item.name} actualizado.`);
      await loadData(true);
    } catch (inventoryError) {
      setSubmitError(getErrorMessage(inventoryError));
      throw inventoryError;
    } finally {
      setInventorySaving(false);
    }
  }

  async function handleDeleteInventoryItem(item) {
    if (!item?.name || deletingInventoryName) {
      return;
    }

    clearFeedback();
    setDeletingInventoryName(item.name);

    try {
      await deleteInventoryItem({
        id: item.name,
      });
      setSubmitSuccess(`Item ${item.name} eliminado.`);
      await loadData(true);
    } catch (inventoryError) {
      setSubmitError(getErrorMessage(inventoryError));
    } finally {
      setDeletingInventoryName("");
    }
  }

  async function handleDeleteSale(sale) {
    const saleKey = getSaleKey(sale);

    if (!sale?.id || deletingSaleKey) {
      return;
    }

    clearFeedback();
    setDeletingSaleKey(saleKey);

    try {
      await deleteSale({
        id: sale.id,
      });
      setSubmitSuccess("Venta eliminada.");
      await loadData(true);
    } catch (deleteError) {
      setSubmitError(getErrorMessage(deleteError));
    } finally {
      setDeletingSaleKey("");
    }
  }

  const salesScreenProps = {
    category,
    setCategory: (nextCategory) => {
      clearFeedback();
      setCategory(nextCategory);
    },
    selectedBarber,
    setSelectedBarber,
    selectedItem,
    setSelectedItem,
    quantity,
    setQuantity,
    inventory,
    barbers,
    sales,
    visibleItems,
    activeBarber,
    activeItem,
    editingSaleId,
    submitSuccess,
    refreshing,
    loading,
    onCancelEditSale: resetSalesSelection,
    onStartEditSale: handleStartEditSale,
    onRefresh: () => loadData(true),
  };

  const headerTitle = TABS.find((tab) => tab.key === currentTab)?.label || "Ventas";

  return (
    <div className="app-shell">
      <main className="phone-frame">
        <section className="phone-screen">
          <header className="topbar">
            <div>
              <p className="eyebrow">App de Contabilidad</p>
              <h1>{currentTab === "sales" ? "Nueva venta" : headerTitle}</h1>
            </div>

            <div className="avatar-badge" aria-hidden="true">
              <img src="/logo-negro.png" alt="" className="header-logo" />
            </div>
          </header>

          {currentTab === "sales" ? <SalesScreen {...salesScreenProps} /> : null}
          {currentTab === "inventory" ? (
            <InventoryScreen
              inventory={inventory}
              loading={loading}
              inventorySaving={inventorySaving}
              deletingInventoryName={deletingInventoryName}
              onAddItem={handleAddInventoryItem}
              onUpdateItem={handleUpdateInventoryItem}
              onDeleteItem={handleDeleteInventoryItem}
            />
          ) : null}
          {currentTab === "barbers" ? (
            <BarbersScreen
              barbers={barbers}
              sales={sales}
              loading={loading}
              barberSaving={barberSaving}
              deletingBarberName={deletingBarberName}
              onAddBarber={handleAddBarber}
              onUpdateBarber={handleUpdateBarber}
              onDeleteBarber={handleDeleteBarber}
            />
          ) : null}
          {currentTab === "register" ? (
            <RegisterScreen
              sales={sales}
              loading={loading}
              deletingSaleKey={deletingSaleKey}
              onDeleteSale={handleDeleteSale}
              onEditSale={handleStartEditSale}
            />
          ) : null}
        </section>

        <footer className="bottom-dock">
          <div className="status-stack" aria-live="polite">
            {loading ? <p className="status-message">Cargando datos desde Google Sheets...</p> : null}
            {error ? <p className="status-message error">{error}</p> : null}
            {submitError ? <p className="status-message error">{submitError}</p> : null}
            {submitSuccess ? <p className="status-message success">{submitSuccess}</p> : null}
          </div>

          {currentTab === "sales" ? (
            <button
              type="button"
              className="save-button"
              onClick={handleSaveSale}
              disabled={loading || !activeItem || !activeBarber || submitting}
            >
              {submitting ? "Guardando..." : editingSaleId ? "Actualizar venta" : "Guardar venta"}
            </button>
          ) : null}

          <TabBar tabs={TABS} currentTab={currentTab} onChange={setCurrentTab} />
        </footer>
      </main>
    </div>
  );
}

export default App;
