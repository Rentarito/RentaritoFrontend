// src/helpers/api.js
const BASE_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://rentaritobackend-swcw.onrender.com";

const API_TOKEN = "rentarito123secure";

export async function fetchMachines() {
  const resp = await fetch(`${BASE_URL}/machines`);
  const data = await resp.json();
  return data.machines || [];
}

export async function fetchManualAnswer({ folder, history, query, probId, sessionId }) {
  const res = await fetch(`${BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ folder, history, query, probId, sessionId }),
  });
  if (!res.ok) throw new Error("Error del servidor");
  return await res.json();
}

export async function fetchHvoStatus(machineNo) {
  const res = await fetch(`${BASE_URL}/hvo-status`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ machineNo }),
  });
  if (!res.ok) throw new Error("Error del servidor");
  return await res.json();
}
