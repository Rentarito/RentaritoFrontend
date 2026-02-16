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
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

  const SIDE_PAD = 20;

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
          // ✅ Baja todo para que el header de tu APP no tape "AVERÍA"
          // Ajusta 56px -> 64px si tu header es más alto
          paddingTop: "calc(54px + env(safe-area-inset-top))",
          paddingRight: SIDE_PAD,
          paddingLeft: SIDE_PAD,
          paddingBottom: 180,
          maxWidth: 760,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* ✅ Encabezado AVERÍA como el original: franja blanca (full dentro del contenedor) */}
        <div
          style={{
            background: "#ffffff",
            marginLeft: -SIDE_PAD,
            marginRight: -SIDE_PAD,
            padding: "22px 24px",
            marginBottom: 22,
          }}
        >
          <h1
            style={{
              fontSize: 20, // ✅ más parecido al original
              fontWeight: 900,
              letterSpacing: "0.5px",
              margin: 0,
              color: "#1a1a1a",
            }}
          >
            AVERÍA
          </h1>
        </div>

        {/* Código de máquina */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontSize: 16,
              fontWeight: 500,
              marginBottom: 8,
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
                height: 48,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                padding: "0 16px",
                fontSize: 15,
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
                width: "min(160px, 42vw)",
                height: 48,
                borderRadius: 12,
                border: "none",
                background: "#0198f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,

                // ✅ CLAVE para alinear perfecto con el input (evita estilos por defecto del botón)
                padding: 0,
                margin: 0,
                lineHeight: 0,
                boxSizing: "border-box",
                appearance: "none",
                WebkitAppearance: "none",
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
              fontSize: 16,
              fontWeight: 500,
              marginBottom: 8,
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
                height: 48,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                padding: "0 14px",
                fontSize: 15,
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
                height: 48,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                padding: "0 16px",
                fontSize: 15,
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
              minHeight: 48,
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
                padding: "8px 14px",
                cursor: "pointer",
                background: "#f3f4f6",
                fontWeight: 600,
                whiteSpace: "nowrap",
                flexShrink: 0,
                fontSize: 14,
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
                  setFilesLabel(count ? `${count} archivo(s) seleccionado(s)` : "Ningún archivo seleccionado");
                }}
              />
            </label>
            <div style={{ color: "#6b7280", fontSize: 14, flexGrow: 1 }}>
              {filesLabel}
            </div>
          </div>
        </div>

        {/* Botón AÑADIR MÁQUINA */}
        <button
          type="button"
          onClick={() => console.log("Añadir máquina")}
          style={{
            marginBottom: 34,
            width: "100%",
            height: 48,
            borderRadius: 24,
            border: "none",
            background: "#0198f1",
            color: "white",
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "0.5px",
            cursor: "pointer",
          }}
        >
          AÑADIR MÁQUINA
        </button>

        {/* ✅ Encabezado INFORMACIÓN DE CONTACTO como el original: franja blanca */}
        <div
          style={{
            background: "#ffffff",
            marginLeft: -SIDE_PAD,
            marginRight: -SIDE_PAD,
            padding: "22px 24px",
            marginBottom: 22,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: "0.6px",
              margin: 0,
              color: "#1a1a1a",
            }}
          >
            INFORMACIÓN DE CONTACTO
          </h2>
        </div>

        {/* Nombre */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 16, fontWeight: 500, marginBottom: 8, color: "#1a1a1a" }}>
            Nombre <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              border: "1px solid #d1d5db",
              padding: "0 16px",
              fontSize: 15,
              outline: "none",
              background: "#fff",
              boxSizing: "border-box",
              color: "#1a1a1a",
            }}
          />
        </div>

        {/* Teléfono */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 16, fontWeight: 500, marginBottom: 8, color: "#1a1a1a" }}>
            Telefono <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="974444444"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              border: "1px solid #d1d5db",
              padding: "0 16px",
              fontSize: 15,
              outline: "none",
              background: "#fff",
              boxSizing: "border-box",
              color: "#1a1a1a",
            }}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 16, fontWeight: 500, marginBottom: 8, color: "#1a1a1a" }}>
            Email <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              border: "1px solid #d1d5db",
              padding: "0 16px",
              fontSize: 15,
              outline: "none",
              background: "#fff",
              boxSizing: "border-box",
              color: "#1a1a1a",
            }}
          />
        </div>

        {/* Fecha y Hora */}
        <div style={{ marginTop: 14, marginBottom: 10, color: "#6b7280", fontStyle: "italic", fontSize: 13 }}>
          Fecha y Hora de la solicitud (esto se realiza automaticamente)
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 6, fontWeight: 500 }}>Fecha</div>
            <input
              value={formatDate(now)}
              disabled
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                padding: "0 16px",
                fontSize: 15,
                background: "#f3f4f6",
                color: "#6b7280",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 6, fontWeight: 500 }}>Hora</div>
            <input
              value={formatTime(now)}
              disabled
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                padding: "0 16px",
                fontSize: 15,
                background: "#f3f4f6",
                color: "#6b7280",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Comentarios */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 16, fontWeight: 500, marginBottom: 8, color: "#1a1a1a" }}>
            Comentarios
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            style={{
              width: "100%",
              minHeight: 130,
              borderRadius: 12,
              border: "1px solid #d1d5db",
              padding: "12px 16px",
              fontSize: 15,
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
            gap: 10,
            fontSize: 16,
            fontWeight: 500,
            cursor: "pointer",
            color: "#1a1a1a",
          }}
        >
          <input
            type="checkbox"
            checked={saveInfo}
            onChange={(e) => setSaveInfo(e.target.checked)}
            style={{ width: 20, height: 20, cursor: "pointer" }}
          />
          Guardar Informacion
        </label>
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
              height: 48,
              borderRadius: 24,
              border: "none",
              background: "#0198f1",
              color: "white",
              fontSize: 15,
              fontWeight: 800,
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
