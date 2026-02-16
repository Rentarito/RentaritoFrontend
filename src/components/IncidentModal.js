import React, { useEffect, useMemo, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function formatDate(d) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function formatTime(d) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function ScanIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3H5a2 2 0 0 0-2 2v2" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 21h2a2 2 0 0 0 2-2v-2" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <rect x="7.5" y="7.5" width="9" height="9" rx="1.5" stroke="white" strokeWidth="2" />
    </svg>
  );
}

// Helpers responsive
const clamp = (min, vw, max) => `clamp(${min}px, ${vw}vw, ${max}px)`;

export default function IncidentModal({
  open,
  onClose,
  initialMachineNo = "",
  initialMachineGroup = "",
}) {
  const now = useMemo(() => new Date(), [open]);

  const [machineNo, setMachineNo] = useState(initialMachineNo || "");
  const [machineGroupSelect, setMachineGroupSelect] = useState("");
  const [machineGroupText, setMachineGroupText] = useState(initialMachineGroup || "");
  const [filesLabel, setFilesLabel] = useState("Ningún archivo seleccionado");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comments, setComments] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);

    setMachineNo(initialMachineNo || "");
    setMachineGroupText(initialMachineGroup || "");
    setMachineGroupSelect("");
    setFilesLabel("Ningún archivo seleccionado");

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, initialMachineNo, initialMachineGroup]);

  if (!open) return null;

  const INPUT_H = clamp(50, 13, 58);
  const INPUT_FONT = clamp(16, 4.2, 20);
  const LABEL_FONT = clamp(22, 6.2, 34);
  const CONTACT_BIG = clamp(30, 8.2, 44);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#f6f7f9",
        overflowY: "auto",
      }}
    >
      {/* Si prefieres quitar esta barra superior, dímelo y la elimino */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#f6f7f9",
          padding: "10px 14px 8px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: clamp(26, 7, 34), fontWeight: 900, letterSpacing: 0.5 }}>
          AVERÍA
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            border: "none",
            background: "transparent",
            fontSize: clamp(22, 6, 28),
            cursor: "pointer",
            lineHeight: 1,
            padding: 6,
          }}
        >
          ✕
        </button>
      </div>

      {/* Contenido: IMPORTANTE el paddingBottom para que no lo tape ENVIAR */}
      <div
        style={{
          padding: `12px 14px calc(220px + env(safe-area-inset-bottom)) 14px`,
          maxWidth: 520,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* Código máquina */}
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: LABEL_FONT, fontWeight: 800, marginBottom: 10 }}>
            Código de máquina
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
            <input
              value={machineNo}
              onChange={(e) => setMachineNo(e.target.value)}
              placeholder="Escribe o Escanea el código"
              style={{
                flex: 1,
                height: INPUT_H,
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "0 14px",
                fontSize: INPUT_FONT,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />

            <button
              type="button"
              onClick={() => console.log("Escanear (pendiente)")}
              style={{
                width: clamp(120, 32, 170),
                height: INPUT_H,
                borderRadius: 14,
                border: "none",
                background: "#3b8ec6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
              title="Escanear"
            >
              <ScanIcon />
            </button>
          </div>
        </div>

        {/* Grupo de máquinas */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: LABEL_FONT, fontWeight: 800, marginBottom: 10 }}>
            Grupo de Máquinas
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <select
              value={machineGroupSelect}
              onChange={(e) => {
                setMachineGroupSelect(e.target.value);
                if (e.target.value) setMachineGroupText(e.target.value);
              }}
              style={{
                flex: 1,
                height: INPUT_H,
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "0 12px",
                fontSize: INPUT_FONT,
                outline: "none",
                background: "#fff",
                color: machineGroupSelect ? "#111" : "#6b7280",
                boxSizing: "border-box",
              }}
            >
              <option value="" disabled>
                Selecciona el Grupo de
              </option>
              <option value="DUMPER">DUMPER</option>
              <option value="EXCAVADORA">EXCAVADORA</option>
              <option value="CARRETILLA">CARRETILLA</option>
              <option value="COMPRESOR">COMPRESOR</option>
            </select>

            <input
              value={machineGroupText}
              onChange={(e) => setMachineGroupText(e.target.value)}
              placeholder="Grupo de Máquina"
              style={{
                flex: 1,
                height: INPUT_H,
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "0 14px",
                fontSize: INPUT_FONT,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Subida de archivos */}
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              height: clamp(56, 14, 64),
              borderRadius: 10,
              border: "1px solid #d7dbe0",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              gap: 12,
              boxSizing: "border-box",
            }}
          >
            <label
              style={{
                minWidth: clamp(120, 28, 150),
                border: "1px solid #8f8f8f",
                borderRadius: 6,
                padding: "10px 12px",
                cursor: "pointer",
                background: "#efefef",
                fontWeight: 700,
                fontSize: clamp(14, 3.8, 16),
                lineHeight: 1.1,
                boxSizing: "border-box",
              }}
            >
              Elegir<br />archivos
              <input
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  const count = e.target.files?.length || 0;
                  setFilesLabel(count ? `${count} archivo(s) seleccionado(s)` : "Ningún archivo seleccionado");
                }}
              />
            </label>

            <div style={{ color: "#333", fontSize: clamp(16, 4.2, 20), lineHeight: 1.15 }}>
              {filesLabel}
            </div>
          </div>
        </div>

        {/* Botón añadir máquina */}
        <button
          type="button"
          onClick={() => console.log("Añadir máquina (pendiente)")}
          style={{
            marginTop: 14,
            width: "100%",
            height: clamp(58, 15, 66),
            borderRadius: 999,
            border: "none",
            background: "#3b8ec6",
            color: "white",
            fontSize: clamp(18, 5, 22),
            fontWeight: 900,
            letterSpacing: 0.6,
            cursor: "pointer",
          }}
        >
          AÑADIR MÁQUINA
        </button>

        {/* Información de contacto */}
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              fontSize: CONTACT_BIG,
              fontWeight: 900,
              letterSpacing: 0.6,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            INFORMACIÓN DE<br />CONTACTO
          </div>

          {/* Nombre */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: clamp(24, 7.2, 40), fontWeight: 900, marginBottom: 8 }}>
              Nombre <span style={{ color: "#d00000" }}>*</span>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              style={{
                width: "100%",
                height: INPUT_H,
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "0 14px",
                fontSize: INPUT_FONT,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Teléfono */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: clamp(24, 7.2, 40), fontWeight: 900, marginBottom: 8 }}>
              Telefono <span style={{ color: "#d00000" }}>*</span>
            </div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="974444444"
              style={{
                width: "100%",
                height: INPUT_H,
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "0 14px",
                fontSize: INPUT_FONT,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: clamp(24, 7.2, 40), fontWeight: 900, marginBottom: 8 }}>
              Email <span style={{ color: "#d00000" }}>*</span>
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              style={{
                width: "100%",
                height: INPUT_H,
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "0 14px",
                fontSize: INPUT_FONT,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Fecha / Hora */}
          <div style={{ marginTop: 12, color: "#8b8b8b", fontStyle: "italic", fontSize: clamp(14, 3.6, 16) }}>
            Fecha y Hora de la solicitud (esto se realiza automaticamente)
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#9aa0a6", fontSize: clamp(22, 6.2, 34), marginBottom: 6 }}>
                Fecha
              </div>
              <input
                value={formatDate(now)}
                disabled
                style={{
                  width: "100%",
                  height: INPUT_H,
                  borderRadius: 10,
                  border: "1px solid #d7dbe0",
                  padding: "0 14px",
                  fontSize: INPUT_FONT,
                  background: "#f1f1f1",
                  color: "#333",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ color: "#9aa0a6", fontSize: clamp(22, 6.2, 34), marginBottom: 6 }}>
                Hora
              </div>
              <input
                value={formatTime(now)}
                disabled
                style={{
                  width: "100%",
                  height: INPUT_H,
                  borderRadius: 10,
                  border: "1px solid #d7dbe0",
                  padding: "0 14px",
                  fontSize: INPUT_FONT,
                  background: "#f1f1f1",
                  color: "#333",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Comentarios */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: clamp(26, 7.2, 40), fontWeight: 900, marginBottom: 8 }}>
              Comentarios
            </div>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              style={{
                width: "100%",
                minHeight: clamp(140, 34, 190),
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "12px 14px",
                fontSize: INPUT_FONT,
                outline: "none",
                background: "#fff",
                resize: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Guardar info */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 14,
              fontSize: clamp(22, 6.5, 36),
              fontWeight: 800,
            }}
          >
            <input
              type="checkbox"
              checked={saveInfo}
              onChange={(e) => setSaveInfo(e.target.checked)}
              style={{ width: clamp(22, 6, 28), height: clamp(22, 6, 28) }}
            />
            Guardar Informacion
          </label>
        </div>
      </div>

      {/* Botón ENVIAR fijo abajo (solo diseño) */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: `12px 14px calc(14px + env(safe-area-inset-bottom)) 14px`,
          background:
            "linear-gradient(180deg, rgba(246,247,249,0) 0%, #f6f7f9 35%, #f6f7f9 100%)",
        }}
      >
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <button
            type="button"
            onClick={() => console.log("Enviar incidencia (pendiente)")}
            style={{
              width: "100%",
              height: clamp(64, 16.5, 76),
              borderRadius: 999,
              border: "none",
              background: "#2f6f90",
              color: "white",
              fontSize: clamp(18, 5.2, 22),
              fontWeight: 900,
              letterSpacing: 0.6,
              cursor: "pointer",
              opacity: 0.85,
            }}
          >
            ENVIAR
          </button>
        </div>
      </div>
    </div>
  );
}
