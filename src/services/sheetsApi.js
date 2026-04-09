const API_URL =
  import.meta.env.VITE_GOOGLE_SHEETS_API_URL ||
  "https://script.google.com/macros/s/AKfycbyba7Oe_OigVHCCfn3I5C_JE8kMLfgMeWpCJBDwbpykvqAqk5kdJ5KNWR_Z1b-kcj9hOg/exec";

function normalizeTable(table = []) {
  if (!Array.isArray(table) || table.length < 2) {
    return [];
  }

  const [headers, ...rows] = table;

  return rows
    .filter((row) => Array.isArray(row) && row.some((value) => value !== ""))
    .map((row) =>
      headers.reduce((item, header, index) => {
        item[header] = row[index] ?? "";
        return item;
      }, {}),
    );
}

export function getErrorMessage(error) {
  if (!error) {
    return "Ha ocurrido un error inesperado.";
  }

  if (typeof error === "string") {
    return error;
  }

  return error.message || "Ha ocurrido un error inesperado.";
}

function parseScriptResponse(text, response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return JSON.parse(text);
  }

  const htmlErrorMatch = text.match(/<div[^>]*>([^<]*(?:Error|TypeError|SyntaxError)[^<]*)<\/div>/i);

  if (htmlErrorMatch?.[1]) {
    throw new Error(htmlErrorMatch[1].trim());
  }

  if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
    return JSON.parse(text);
  }

  if (!response.ok) {
    throw new Error("La API devolvio una respuesta no valida.");
  }

  return { ok: true, raw: text };
}

async function sendRequest(method, body) {
  const requestUrl =
    method === "GET" ? `${API_URL}${API_URL.includes("?") ? "&" : "?"}t=${Date.now()}` : API_URL;

  if (method === "POST") {
    console.log("[GoogleSheets] POST request", {
      url: requestUrl,
      body,
    });
  }

  const response = await fetch(requestUrl, {
    method,
    headers: body
      ? {
          "Content-Type": "text/plain",
        }
      : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    redirect: "follow",
  });

  if (method === "POST") {
    console.log("[GoogleSheets] POST response", {
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
      url: response.url,
    });
  }

  const text = await response.text();

  return parseScriptResponse(text, response);
}

export async function fetchSheetData() {
  const data = await sendRequest("GET");

  return {
    inventory: normalizeTable(data.inventory),
    barbers: normalizeTable(data.barbers),
    sales: normalizeTable(data.sales),
  };
}

function buildSalesRow(payload) {
  const row = [
    String(payload.id ?? "").trim(),
    String(payload.itemName ?? "").trim(),
    String(payload.type ?? "").trim(),
    Number(payload.quantity),
    Number(payload.totalPrice),
    Number(payload.barberShare),
    Number(payload.shopShare),
    String(payload.barberName ?? "").trim(),
    String(payload.date ?? "").trim(),
  ];

  const hasMissingField = row.some((value) => value === "" || value === undefined || value === null);
  const hasInvalidNumber = row.slice(3, 7).some((value) => Number.isNaN(value));

  if (hasMissingField || hasInvalidNumber) {
    throw new Error("La fila de ventas no es valida. Revisa item, barbero, cantidad e importes.");
  }

  console.log("[GoogleSheets] sales row", row);

  return row;
}

export async function createSale(payload) {
  const row = buildSalesRow(payload);

  return sendRequest("POST", {
    sheet: "Ventas",
    row,
  });
}

export async function updateSale(payload) {
  const row = buildSalesRow(payload);

  return sendRequest("POST", {
    sheet: "Ventas",
    action: "update",
    id: payload.id,
    row,
  });
}

export async function addBarber(payload) {
  const row = [payload.name, payload.photo || ""];

  console.log("[GoogleSheets] barber row", row);

  return sendRequest("POST", {
    sheet: "Barberos",
    row,
  });
}

export async function updateBarber(payload) {
  const row = [payload.name, payload.photo || ""];

  console.log("[GoogleSheets] barber row", row);

  return sendRequest("POST", {
    sheet: "Barberos",
    action: "update",
    id: payload.editingId,
    row,
  });
}

export async function deleteBarber({ id }) {
  return sendRequest("POST", {
    sheet: "Barberos",
    action: "delete",
    id,
  });
}

export async function deleteSale(payload) {
  return sendRequest("POST", {
    sheet: "Ventas",
    action: "delete",
    id: payload.id,
  });
}

export async function addInventoryItem(payload) {
  const row = [
    payload.name,
    payload.type,
    Number(payload.totalPrice),
    Number(payload.barberShare),
    Number(payload.shopShare),
  ];

  console.log("[GoogleSheets] inventory row", row);

  return sendRequest("POST", {
    sheet: "Inventario",
    row,
  });
}

export async function updateInventoryItem(payload) {
  const row = [
    payload.name,
    payload.type,
    Number(payload.totalPrice),
    Number(payload.barberShare),
    Number(payload.shopShare),
  ];

  console.log("[GoogleSheets] inventory row", row);

  return sendRequest("POST", {
    sheet: "Inventario",
    action: "update",
    id: payload.editingId,
    row,
  });
}

export async function deleteInventoryItem(payload) {
  return sendRequest("POST", {
    sheet: "Inventario",
    action: "delete",
    id: payload.id,
  });
}
