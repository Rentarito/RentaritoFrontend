import React, { useEffect, useMemo, useRef, useState } from "react";
import machineCache from "../helpers/machineCache";
import { fetchMachines } from "../helpers/api";
import { Html5Qrcode } from "html5-qrcode";

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

  // ✅ SELECT (izquierda): grupo que viene del chat
  const [machineGroupSelect, setMachineGroupSelect] = useState(initialMachineGroup || "");
  // ✅ INPUT (derecha): libre para que el usuario ponga el número
  const [machineGroupText, setMachineGroupText] = useState("");

  const [filesLabel, setFilesLabel] = useState("Ningún archivo seleccionado");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comments, setComments] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);

  // ====== ✅ QR: MISMO COMPORTAMIENTO QUE MachineSelection ======
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrError, setQrError] = useState(null);
  const qrCodeScannerRef = useRef(null);
  const prevNativeHandlerRef = useRef(null);

  function handleMachineFromQr(decodedText) {
    const codigo = (decodedText || "").trim();
    if (!codigo) {
      setQrError("No se ha leído ningún QR.");
      return;
    }
    setQrError(null);
    setMachineNo(codigo);
  }

  // Handler para QR nativo (igual que MachineSelection)
  useEffect(() => {
    if (!open) return;

    prevNativeHandlerRef.current = window.setQrFromNative;

    window.setQrFromNative = async (decodedText) => {
      try {
        if (!decodedText) return;
        handleMachineFromQr(decodedText);
      } catch (e) {
        console.error("Error procesando QR nativo", e);
        setQrError("Error procesando el QR.");
      }
    };

    return () => {
      if (prevNativeHandlerRef.current) {
        window.setQrFromNative = prevNativeHandlerRef.current;
        prevNativeHandlerRef.current = null;
      } else {
        try {
          delete window.setQrFromNative;
        } catch {}
      }
    };
  }, [open]);

  // Modal QR web (igual que MachineSelection)
  useEffect(() => {
    const regionId = "incident-qr-modal-reader";

    if (!showQRModal) {
      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current.stop().catch(() => {});
        qrCodeScannerRef.current.clear().catch(() => {});
        qrCodeScannerRef.current = null;
      }
      return;
    }

    setTimeout(() => {
      const html5QrCode = new Html5Qrcode(regionId, { verbose: false });
      qrCodeScannerRef.current = html5QrCode;

      Html5Qrcode.getCameras()
        .then((devices) => {
          if (!devices || devices.length === 0) {
            setQrError("No se detectó ninguna cámara.");
            setShowQRModal(false);
            return;
          }

          html5QrCode
            .start(
              { facingMode: "environment" },
              {
                fps: 10,
                qrbox: function (viewfinderWidth, viewfinderHeight) {
                  const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                  return { width: minEdge * 0.8, height: minEdge * 0.98 };
                },
              },
              (decodedText) => {
                setShowQRModal(false);
                html5QrCode
                  .stop()
                  .then(() => html5QrCode.clear())
                  .catch(() => {});
                qrCodeScannerRef.current = null;

                handleMachineFromQr(decodedText);
              },
              () => {}
            )
            .catch(() => {
              setQrError("No se pudo iniciar el escáner.");
              setShowQRModal(false);
              html5QrCode.clear().catch(() => {});
              qrCodeScannerRef.current = null;
            });
        })
        .catch(() => {
          setShowQRModal(false);
        });
    }, 300);

    return () => {
      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current.stop().catch(() => {});
        qrCodeScannerRef.current.clear().catch(() => {});
        qrCodeScannerRef.current = null;
      }
    };
  }, [showQRModal]);

  // ====== ✅ Cargar lista de grupos desde /machines (como MachineSelection) ======
  const [machines, setMachines] = useState([]);
  const [groupError, setGroupError] = useState(null);

  useEffect(() => {
    async function loadMachines() {
      try {
        let ms = machineCache.machines;
        if (!ms) {
          ms = await fetchMachines();
          machineCache.machines = ms;
        }
        setMachines(ms);
        setGroupError(null);
      } catch (e) {
        setGroupError("Error cargando máquinas. Reintenta más tarde.");
      }
    }

    if (open) loadMachines();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);

    setMachineNo(initialMachineNo || "");

    // ✅ aquí es donde “escribes” el grupo que viene del chat EN EL SELECT sin cambiar diseño
    setMachineGroupSelect((initialMachineGroup || "").toUpperCase());

    // ✅ el campo de la derecha se queda libre (número)
    setMachineGroupText("");

    setFilesLabel("Ningún archivo seleccionado");

    setQrError(null);
    setShowQRModal(false);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);

      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current.stop().catch(() => {});
        qrCodeScannerRef.current.clear().catch(() => {});
        qrCodeScannerRef.current = null;
      }
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
          paddingTop: "calc(35px + env(safe-area-inset-top))",
          paddingRight: SIDE_PAD,
          paddingLeft: SIDE_PAD,
          paddingBottom: 180,
          maxWidth: 760,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* Encabezado AVERÍA */}
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
              fontSize: 20,
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              alignItems: "stretch",
            }}
          >
            <div style={{ height: 48 }}>
              <input
                value={machineNo}
                onChange={(e) => setMachineNo(e.target.value)}
                placeholder="Escribe o Escanea el código"
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  margin: 0,
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  padding: "0 16px",
                  fontSize: 15,
                  outline: "none",
                  background: "#fff",
                  boxSizing: "border-box",
                  color: "#1a1a1a",
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              />
            </div>

            <div style={{ height: 48 }}>
              <button
                type="button"
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    typeof window.openNativeQrScanner === "function"
                  ) {
                    window.openNativeQrScanner();
                  } else {
                    setShowQRModal(true);
                  }
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 12,
                  border: "none",
                  background: "#0198f1",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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

          {qrError && <div style={{ color: "red", marginTop: 16 }}>{qrError}</div>}
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
            Grupo de máquinas
          </label>

          {/* ✅ MISMO DISEÑO que tenías: select + input */}
          <div style={{ display: "flex", gap: 12 }}>
            <select
              value={machineGroupSelect}
              onChange={(e) => {
                // ✅ se queda escrito en ESTE MISMO CAMPO
                setMachineGroupSelect(e.target.value);

                // ✅ NO tocamos el campo de la derecha (número)
                // (antes lo estabas copiando; ahora NO)
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
                color: machineGroupSelect ? "#1a1a1a" : "#0198f1",
                boxSizing: "border-box",
              }}
            >
              <option value="" disabled>
                Selecciona el Grupo de la máquina
              </option>

              {/* ✅ Lista real de máquinas (como MachineSelection) */}
              {machines.map((m, idx) => (
                <option key={m + idx} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <input
              value={machineGroupText}
              onChange={(e) => setMachineGroupText(e.target.value)}
              placeholder="Grupo de máquina"
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

          {groupError && <div style={{ color: "red", marginTop: 16 }}>{groupError}</div>}
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
                  setFilesLabel(
                    count ? `${count} archivo(s) seleccionado(s)` : "Ningún archivo seleccionado"
                  );
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

        {/* Encabezado INFORMACIÓN DE CONTACTO */}
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
                color: "#0198f1",
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
                color: "#0198f1",
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

      {/* --- MODAL QR (MISMO ESTILO/COMPORTAMIENTO QUE MachineSelection) --- */}
      {showQRModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.93)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: 24,
              position: "relative",
              boxShadow: "0 6px 36px #111a",
              maxWidth: 400,
              width: "94vw",
            }}
          >
            <div style={{ textAlign: "right" }}>
              <button
                onClick={async () => {
                  if (qrCodeScannerRef.current) {
                    try {
                      await qrCodeScannerRef.current.stop();
                    } catch {}
                    try {
                      await qrCodeScannerRef.current.clear();
                    } catch {}
                    qrCodeScannerRef.current = null;
                  }
                  setShowQRModal(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  color: "#0198f1",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                aria-label="Cerrar escáner"
              >
                ×
              </button>
            </div>

            <div
              id="incident-qr-modal-reader"
              style={{
                width: "100%",
                height: 320,
                maxWidth: 360,
                margin: "0 auto",
                borderRadius: 12,
                overflow: "hidden",
              }}
            />
            <div
              style={{
                color: "#0198f1",
                marginTop: 12,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Apunta con la cámara al QR
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
