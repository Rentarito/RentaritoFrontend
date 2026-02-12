// helpers/api.js
const BASE_URL = "https://rentaritobackend-swcw.onrender.com";
const API_TOKEN = "rentarito123secure";

// Devuelve la lista de máquinas
export async function fetchMachines() {
  const resp = await fetch(`${BASE_URL}/machines`);
  const data = await resp.json();
  return data.machines || [];
}

// Envía una consulta al bot/manual
export async function fetchManualAnswer({ folder, history, query, probId, sessionId }) {
  const res = await fetch(`${BASE_URL}/ask`, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      folder,
      history,
      query,
      probId,
      sessionId,
    }),
  });
  if (!res.ok) throw new Error("Error del servidor");
  return await res.json();
}

export async function fetchMachineHvo(machineNo) {
  const resp = await fetch(`${BASE_URL}/machine-hvo?machineNo=${encodeURIComponent(machineNo)}`, {
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
    },
  });

  if (!resp.ok) throw new Error("Error consultando HVO");
  return await resp.json();
}
