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
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#f8f9fa",
        overflowY: "auto",
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
      }}
    >
      <div
        style={{
          padding: "24px 20px 180px 20px",
          maxWidth: 760,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* Título AVERÍA - sin barra sticky */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "0.5px",
            margin: "0 0 32px 0",
            color: "#1a1a1a",
          }}
        >
          AVERÍA
        </h1>

        {/* Código de máquina */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 18,
              fontWeight: 500,
              marginBottom: 10,
              color: "#1a1a1a",
            }}
          >
            Código de máquina
          </label>

          <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
            <input
              value={machineNo}
              onChange={(e) => setMachineNo(e.target.value)}
              placeholder="Escribe o Escanea el código"
              style={{
                flex: 1,
                height: 56,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                padding: "0 16px",
                fontSize: 16,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
                color: "#1a1a1a",
              }}
            />

            <button
              type="button"
              onClick={() => console.log("Escanear")}
              style={{
                width: 160,
                height: 56,
                borderRadius: 12,
                border: "none",
                background: "#3b82f6",
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

        {/* Grupo de Máquinas */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 18,
              fontWeight: 500,
              marginBottom: 10,
              color: "#1a1a1a",
            }}
          >
            Grupo de Máquinas
          </label>

          <div style={{ display: "flex", gap: 12 }}>
            <select
              value={machineGroupSelect}
              onChange={(e) => {
                setMachineGroupSelect(e.target.value);
                if (e.target.value) setMachineGroupText(e.target.value);
              }}
              style={{
                flex: 1,
                height: 56,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                padding: "0 14px",
                fontSize: 16,
                outline: "none",
                background: "#fff",
                color: machineGroupSelect ? "#1a1a1a" : "#9ca3af",
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
                height: 56,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                padding: "0 16px",
                fontSize: 16,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
                color: "#1a1a1a",
              }}
            />
          </div>
        </div>

        {/* Subida de archivos */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              minHeight: 56,
              borderRadius: 12,
              border: "1px solid #d1d5db",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              gap: 12,
              boxSizing: "border-box",
            }}
          >
            <label
              style={{
                border: "1px solid #6b7280",
                borderRadius: 6,
                padding: "10px 16px",
                cursor: "pointer",
                background: "#f3f4f6",
                fontWeight: 600,
                whiteSpace: "nowrap",
                flexShrink: 0,
                fontSize: 15,
                color: "#1a1a1a",
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
                    count
                      ? `${count} archivo(s) seleccionado(s)`
                      : "Ningún archivo seleccionado"
                  );
                }}
              />
            </label>
            <div style={{ color: "#6b7280", fontSize: 15, flexGrow: 1 }}>
              {filesLabel}
            </div>
          </div>
        </div>

        {/* Botón AÑADIR MÁQUINA */}
        <button
          type="button"
          onClick={() => console.log("Añadir máquina")}
          style={{
            marginBottom: 40,
            width: "100%",
            height: 56,
            borderRadius: 28,
            border: "none",
            background: "#3b82f6",
            color: "white",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.5px",
            cursor: "pointer",
          }}
        >
          AÑADIR MÁQUINA
        </button>

        {/* INFORMACIÓN DE CONTACTO */}
        <div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: "0.5px",
              marginBottom: 28,
              color: "#1a1a1a",
            }}
          >
            INFORMACIÓN DE CONTACTO
          </h2>

          {/* Nombre */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 18,
                fontWeight: 500,
                marginBottom: 10,
                color: "#1a1a1a",
              }}
            >
              Nombre <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              style={{
                width: "100%",
                height: 56,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                padding: "0 16px",
                fontSize: 16,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
                color: "#1a1a1a",
              }}
            />
          </div>

          {/* Teléfono */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 18,
                fontWeight: 500,
                marginBottom: 10,
                color: "#1a1a1a",
              }}
            >
              Telefono <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="974444444"
              style={{
                width: "100%",
                height: 56,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                padding: "0 16px",
                fontSize: 16,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
                color: "#1a1a1a",
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 18,
                fontWeight: 500,
                marginBottom: 10,
                color: "#1a1a1a",
              }}
            >
              Email <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              style={{
                width: "100%",
                height: 56,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                padding: "0 16px",
                fontSize: 16,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
                color: "#1a1a1a",
              }}
            />
          </div>

          {/* Fecha y Hora */}
          <div
            style={{
              marginTop: 20,
              marginBottom: 12,
              color: "#6b7280",
              fontStyle: "italic",
              fontSize: 14,
            }}
          >
            Fecha y Hora de la solicitud (esto se realiza automaticamente)
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 16,
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                Fecha
              </div>
              <input
                value={formatDate(now)}
                disabled
                style={{
                  width: "100%",
                  height: 56,
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  padding: "0 16px",
                  fontSize: 16,
                  background: "#f3f4f6",
                  color: "#6b7280",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 16,
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                Hora
              </div>
              <input
                value={formatTime(now)}
                disabled
                style={{
                  width: "100%",
                  height: 56,
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  padding: "0 16px",
                  fontSize: 16,
                  background: "#f3f4f6",
                  color: "#6b7280",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Comentarios */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 18,
                fontWeight: 500,
                marginBottom: 10,
                color: "#1a1a1a",
              }}
            >
              Comentarios
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              style={{
                width: "100%",
                minHeight: 140,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                padding: "14px 16px",
                fontSize: 16,
                outline: "none",
                background: "#fff",
                resize: "vertical",
                boxSizing: "border-box",
                fontFamily: "inherit",
                color: "#1a1a1a",
              }}
            />
          </div>

          {/* Guardar información */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 18,
              fontWeight: 500,
              cursor: "pointer",
              color: "#1a1a1a",
            }}
          >
            <input
              type="checkbox"
              checked={saveInfo}
              onChange={(e) => setSaveInfo(e.target.checked)}
              style={{
                width: 22,
                height: 22,
                cursor: "pointer",
              }}
            />
            Guardar Informacion
          </label>
        </div>
      </div>

      {/* Botón ENVIAR fijo */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "16px 20px calc(20px + env(safe-area-inset-bottom)) 20px",
          background: "linear-gradient(180deg, rgba(248,249,250,0) 0%, #f8f9fa 30%)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <button
            type="button"
            onClick={() => console.log("Enviar incidencia")}
            style={{
              width: "100%",
              height: 56,
              borderRadius: 28,
              border: "none",
              background: "#1e40af",
              color: "white",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.5px",
              cursor: "pointer",
            }}
          >
            ENVIAR
          </button>
        </div>
      </div>
    </div>
  );
}