function toNumber(value) {
  const parsedValue = Number(value || 0);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeType(value) {
  return String(value || "").trim().toLowerCase();
}

export function calculateSummaryTotals(sales = []) {
  return sales.reduce(
    (summary, sale) => {
      const saleType = normalizeType(sale.type);
      const totalPrice = toNumber(sale.totalPrice);
      const quantity = toNumber(sale.quantity) || 1;
      const barberName = String(sale.barberName || "Sin asignar").trim() || "Sin asignar";

      summary.totalGenerated += totalPrice;

      if (saleType === "product") {
        summary.totalProducts += quantity;
        summary.productRevenue += totalPrice;
      } else {
        summary.totalServices += quantity;
      }

      summary.totalsByBarber[barberName] =
        (summary.totalsByBarber[barberName] || 0) + totalPrice;

      return summary;
    },
    {
      totalGenerated: 0,
      totalServices: 0,
      totalProducts: 0,
      productRevenue: 0,
      totalsByBarber: {},
    },
  );
}

export function getBarberSummaryRows(sales = [], barbers = []) {
  const { totalsByBarber } = calculateSummaryTotals(sales);
  const barberNames = new Set([
    ...barbers.map((barber) => String(barber.name || "").trim()).filter(Boolean),
    ...Object.keys(totalsByBarber),
  ]);

  return [...barberNames]
    .map((barberName) => ({
      barberName,
      totalGenerated: totalsByBarber[barberName] || 0,
    }))
    .sort((a, b) => b.totalGenerated - a.totalGenerated || a.barberName.localeCompare(b.barberName, "es"));
}
