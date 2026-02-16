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

  // paddings/gaps responsive MUY SUAVES (sin cambiar el diseño base)
  const SIDE_PAD = "min(16px, 4vw)";
  const GAP = "min(14px, 3.5vw)";
  const SCAN_W = "min(170px, 42vw)"; // en pantallas normales sigue siendo 170px
  const CONTENT_BOTTOM_PAD = "150px"; // un poco más que 120 para móviles bajos

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#f6f7f9",
        overflowY: "auto",

        // ✅ CLAVE: evita “font boosting” en móvil (lo que te hacía letras gigantes)
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#f6f7f9",
          padding: `14px ${SIDE_PAD} 10px ${SIDE_PAD}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(0,0,0,0.04)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 0.5 }}>
          AVERÍA
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            border: "none",
            background: "transparent",
            fontSize: 28,
            cursor: "pointer",
            lineHeight: 1,
            padding: 6,
          }}
        >
          ✕
        </button>
      </div>

      {/* Contenido */}
      <div
        style={{
          padding: `18px ${SIDE_PAD} ${CONTENT_BOTTOM_PAD} ${SIDE_PAD}`,
          maxWidth: 520,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* Código máquina */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 26, fontWeight: 500, marginBottom: 12 }}>
            Código de máquina
          </div>

          <div style={{ display: "flex", gap: GAP, alignItems: "stretch" }}>
            <input
              value={machineNo}
              onChange={(e) => setMachineNo(e.target.value)}
              placeholder="Escribe o Escanea el código"
              style={{
                flex: 1,
                height: 58,
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "0 16px",
                fontSize: 18,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />

            <button
              type="button"
              onClick={() => console.log("Escanear (pendiente)")}
              style={{
                width: SCAN_W, // ✅ responsive suave
                height: 58,
                borderRadius: 14,
                border: "none",
                background: "#3b8ec6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
              title="Escanear"
            >
              <ScanIcon />
            </button>
          </div>
        </div>

        {/* Grupo de máquinas */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 500, marginBottom: 12 }}>
            Grupo de Máquinas
          </div>

          <div style={{ display: "flex", gap: GAP }}>
            <select
              value={machineGroupSelect}
              onChange={(e) => {
                setMachineGroupSelect(e.target.value);
                if (e.target.value) setMachineGroupText(e.target.value);
              }}
              style={{
                flex: 1,
                height: 58,
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "0 14px",
                fontSize: 18,
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
                height: 58,
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "0 16px",
                fontSize: 18,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Subida de archivos */}
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              height: 64,
              borderRadius: 10,
              border: "1px solid #d7dbe0",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              gap: 12,
              boxSizing: "border-box",
            }}
          >
            <label
              style={{
                border: "1px solid #8f8f8f",
                borderRadius: 4,
                padding: "8px 12px",
                cursor: "pointer",
                background: "#efefef",
                fontWeight: 600,

                // ✅ evita que se parta en 2 líneas en móviles
                whiteSpace: "nowrap",
                flexShrink: 0,
                fontSize: 18, // ✅ para que no lo “boostee” el móvil
              }}
            >
              Elegir archivos
              <input
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  const count = e.target.files?.length || 0;
                  setFilesLabel(
                    count ? `${count} archivo(s) seleccionado(s)` : "Ningún archivo seleccionado"
                  );
                }}
              />
            </label>
            <div style={{ color: "#333", fontSize: 18 }}>{filesLabel}</div>
          </div>
        </div>

        {/* Botón añadir máquina */}
        <button
          type="button"
          onClick={() => console.log("Añadir máquina (pendiente)")}
          style={{
            marginTop: 18,
            width: "100%",
            height: 64,
            borderRadius: 999,
            border: "none",
            background: "#3b8ec6",
            color: "white",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 0.6,
            cursor: "pointer",
          }}
        >
          AÑADIR MÁQUINA
        </button>

        {/* Información de contacto */}
        <div style={{ marginTop: 26 }}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: 0.6,
              marginBottom: 18,
              textAlign: "center",
            }}
          >
            INFORMACIÓN DE CONTACTO
          </div>

          {/* Nombre */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 26, fontWeight: 500, marginBottom: 10 }}>
              Nombre <span style={{ color: "#d00000" }}>*</span>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              style={{
                width: "100%",
                height: 58,
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "0 16px",
                fontSize: 18,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Teléfono */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 500, marginBottom: 10 }}>
              Telefono <span style={{ color: "#d00000" }}>*</span>
            </div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="974444444"
              style={{
                width: "100%",
                height: 58,
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "0 16px",
                fontSize: 18,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 500, marginBottom: 10 }}>
              Email <span style={{ color: "#d00000" }}>*</span>
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              style={{
                width: "100%",
                height: 58,
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "0 16px",
                fontSize: 18,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Fecha / Hora */}
          <div style={{ marginTop: 18, color: "#8b8b8b", fontStyle: "italic", fontSize: 16 }}>
            Fecha y Hora de la solicitud (esto se realiza automaticamente)
          </div>

          <div style={{ display: "flex", gap: GAP, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#9aa0a6", fontSize: 24, marginBottom: 8 }}>Fecha</div>
              <input
                value={formatDate(now)}
                disabled
                style={{
                  width: "100%",
                  height: 58,
                  borderRadius: 10,
                  border: "1px solid #d7dbe0",
                  padding: "0 16px",
                  fontSize: 18,
                  background: "#f1f1f1",
                  color: "#333",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ color: "#9aa0a6", fontSize: 24, marginBottom: 8 }}>Hora</div>
              <input
                value={formatTime(now)}
                disabled
                style={{
                  width: "100%",
                  height: 58,
                  borderRadius: 10,
                  border: "1px solid #d7dbe0",
                  padding: "0 16px",
                  fontSize: 18,
                  background: "#f1f1f1",
                  color: "#333",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Comentarios */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 500, marginBottom: 10 }}>
              Comentarios
            </div>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              style={{
                width: "100%",
                minHeight: 160,
                borderRadius: 10,
                border: "1px solid #d7dbe0",
                padding: "14px 16px",
                fontSize: 18,
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
              marginTop: 18,
              fontSize: 26,
              fontWeight: 500,
            }}
          >
            <input
              type="checkbox"
              checked={saveInfo}
              onChange={(e) => setSaveInfo(e.target.checked)}
              style={{ width: 26, height: 26 }}
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

          // ✅ safe area iPhone (no afecta Android)
          padding: `12px ${SIDE_PAD} calc(18px + env(safe-area-inset-bottom)) ${SIDE_PAD}`,

          background:
            "linear-gradient(180deg, rgba(246,247,249,0) 0%, #f6f7f9 35%, #f6f7f9 100%)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <button
            type="button"
            onClick={() => console.log("Enviar incidencia (pendiente)")}
            style={{
              width: "100%",
              height: 64,
              borderRadius: 999,
              border: "none",
              background: "#2f6f90",
              color: "white",
              fontSize: 20,
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
