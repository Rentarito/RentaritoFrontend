import React, { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const BACKEND_BASE_URL =
  process.env.REACT_APP_BACKEND_URL || "https://rentaritobackend-swcw.onrender.com";

const CONTACT_LS_KEY = "rentarito_incident_contact_v1";

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
  chatHistory = [],
}) {
  const now = useMemo(() => new Date(), [open]);

  const [machineNo, setMachineNo] = useState(initialMachineNo || "");
  const [machineGroupSelect, setMachineGroupSelect] = useState(initialMachineGroup || "");
  const [machineGroupText, setMachineGroupText] = useState("");

  const [filesLabel, setFilesLabel] = useState("Ningún archivo seleccionado");
  const [attachedFiles, setAttachedFiles] = useState([]); // File[]
  const fileInputRef = useRef(null);

  // máquinas añadidas
  const [addedMachines, setAddedMachines] = useState([]); // [{id, display, machineNo, fleetCode, files}]
  const [addMachineError, setAddMachineError] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comments, setComments] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);

  const formRef = useRef(null);

  // resumen IA
  const userEditedCommentsRef = useRef(false);
  const summaryDoneRef = useRef(false);

  // ====== QR ======
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

  // ====== reset al abrir ======
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);

    setMachineNo(initialMachineNo || "");
    setMachineGroupSelect((initialMachineGroup || "").toUpperCase());
    setMachineGroupText("");

    setFilesLabel("Ningún archivo seleccionado");
    setAttachedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setAddedMachines([]);
    setAddMachineError(null);

    setQrError(null);
    setShowQRModal(false);

    // reset resumen
    summaryDoneRef.current = false;
    userEditedCommentsRef.current = false;
    setComments("");

    // reset contacto (luego se auto-carga si hay guardado)
    setName("");
    setPhone("");
    setEmail("");
    setSaveInfo(false);

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

  // ====== cargar datos guardados ======
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(CONTACT_LS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved) return;

      const hasAny = !!(saved.name || saved.phone || saved.email);
      if (!hasAny) return;

      setName(saved.name || "");
      setPhone(saved.phone || "");
      setEmail(saved.email || "");
      setSaveInfo(true);
    } catch {}
  }, [open]);

  // ====== guardar/borrar según checkbox ======
  useEffect(() => {
    if (!open) return;

    try {
      if (saveInfo) {
        localStorage.setItem(
          CONTACT_LS_KEY,
          JSON.stringify({ name: name || "", phone: phone || "", email: email || "" })
        );
      } else {
        localStorage.removeItem(CONTACT_LS_KEY);
      }
    } catch {}
  }, [open, saveInfo, name, phone, email]);

  // ====== resumen IA ======
  useEffect(() => {
    if (!open) return;
    if (summaryDoneRef.current) return;
    if (!Array.isArray(chatHistory) || chatHistory.length === 0) return;
    if (userEditedCommentsRef.current) return;

    summaryDoneRef.current = true;
    setComments("Generando resumen automático de la incidencia...");

    const trimmed = chatHistory
      .filter((m) => m && typeof m.content === "string")
      .slice(-30)
      .map((m) => ({ role: m.role, content: m.content }));

    (async () => {
      try {
        const resp = await fetch(`${BACKEND_BASE_URL}/incident-summary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            history: trimmed,
            machineFolder: initialMachineGroup || "",
            machineNo: initialMachineNo || "",
          }),
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const summary = (data?.summary || "").trim();

        if (!userEditedCommentsRef.current) {
          setComments(summary || "");
        }
      } catch (e) {
        console.error("Error resumen incidencia:", e);
        if (!userEditedCommentsRef.current) setComments("");
      }
    })();
  }, [open, chatHistory, initialMachineGroup, initialMachineNo]);

  if (!open) return null;

  const SIDE_PAD = 20;

  // tooltip nativo con texto exacto
  const setRequiredMsg = (e) => {
    const el = e.target;
    if (el.validity && el.validity.valueMissing) el.setCustomValidity("Completa este campo");
    else el.setCustomValidity("");
  };

  const clearFiles = () => {
    setAttachedFiles([]);
    setFilesLabel("Ningún archivo seleccionado");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddMachine = () => {
    const code = (machineNo || "").trim();
    const fleet = (machineGroupText || "").trim();

    // Reglas:
    // - Se puede añadir si hay código (machineNo) O si hay flota (machineGroupText)
    // - NO se puede añadir si solo hay archivos
    if (!code && !fleet) {
      setAddMachineError(
        "Debes escanear/escribir el código de máquina o indicar un Grupo de Máquina antes de añadir."
      );
      return;
    }

    setAddMachineError(null);

    const display = code ? code : `${machineGroupSelect} - ${fleet}`;

    const item = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      display,
      machineNo: code || "",
      fleetCode: code ? "" : fleet,
      baseMachine: machineGroupSelect || "",
      files: attachedFiles || [],
    };

    setAddedMachines((prev) => [item, ...prev]);

    // Reset inputs de añadir máquina
    setMachineNo(""); // se puede volver a meter otro código si quiere
    setMachineGroupText("");
    clearFiles();
  };

  const handleDeleteMachine = (id) => {
    setAddedMachines((prev) => prev.filter((x) => x.id !== id));
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();

    const form = formRef.current;
    if (form && typeof form.reportValidity === "function") {
      const ok = form.reportValidity();
      if (!ok) return;
    }

    // Aquí ya tendrás addedMachines con los datos listos para enviarlos cuando implementes ENVIAR
    console.log("Enviar incidencia", { addedMachines });
  };

  const reqStar = (
    <span className="req-star" aria-hidden="true">
      *
    </span>
  );

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
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
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
                  className="incident-field"
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
              Grupo de Máquinas
            </label>

            <div style={{ display: "flex", gap: 12 }}>
              {/* IZQUIERDA FIJA: la máquina/grupo del chat (sin selector) */}
              <input
                value={machineGroupSelect}
                disabled
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  padding: "0 16px",
                  fontSize: 15,
                  outline: "none",
                  background: "#f3f4f6",
                  boxSizing: "border-box",
                  color: "#1a1a1a",
                  cursor: "not-allowed",
                }}
              />

              {/* DERECHA IGUAL: el usuario puede escribir la flota */}
              <input
                className="incident-field"
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
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setAttachedFiles(files);
                    const count = files.length;
                    setFilesLabel(
                      count ? `${count} archivo(s) seleccionado(s)` : "Ningún archivo seleccionado"
                    );
                  }}
                />
              </label>
              <div style={{ color: "#6b7280", fontSize: 14, flexGrow: 1 }}>{filesLabel}</div>
            </div>
          </div>

          {/* Botón AÑADIR MÁQUINA */}
          <button
            type="button"
            onClick={handleAddMachine}
            style={{
              marginBottom: 16,
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

          {addMachineError && (
            <div style={{ color: "red", marginBottom: 18, fontSize: 14 }}>{addMachineError}</div>
          )}

          {/* LISTADO DE MÁQUINAS AÑADIDAS */}
          {addedMachines.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              {addedMachines.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: "1px solid #e5e7eb",
                    padding: 16,
                    marginBottom: 14,
                    boxShadow: "0 2px 14px rgba(17,24,39,0.05)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 500,
                      color: "#111827",
                      textAlign: "center",
                      marginBottom: 14,
                    }}
                  >
                    <span style={{ fontWeight: 400 }}>Identificador de Máquina:</span>{" "}
                    <span style={{ fontWeight: 700 }}>{m.display}</span>
                  </div>

                  {Array.isArray(m.files) && m.files.length > 0 && (
                    <div style={{ textAlign: "center", color: "#6b7280", fontSize: 13, marginTop: -6, marginBottom: 12 }}>
                      Archivos adjuntos: {m.files.length}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteMachine(m.id)}
                    style={{
                      width: "100%",
                      height: 48,
                      borderRadius: 24,
                      border: "none",
                      background: "#0198f1",
                      color: "white",
                      fontSize: 15,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    DELETE
                  </button>
                </div>
              ))}
            </div>
          )}

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
            <label
              className="incident-required-label"
              style={{
                display: "block",
                fontSize: 16,
                fontWeight: 500,
                marginBottom: 8,
                color: "#1a1a1a",
              }}
            >
              Nombre {reqStar}
            </label>
            <input
              className="incident-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              required
              onInvalid={setRequiredMsg}
              onInput={(e) => e.target.setCustomValidity("")}
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
            <label
              className="incident-required-label"
              style={{
                display: "block",
                fontSize: 16,
                fontWeight: 500,
                marginBottom: 8,
                color: "#1a1a1a",
              }}
            >
              Telefono {reqStar}
            </label>
            <input
              className="incident-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="974444444"
              type="tel"
              inputMode="tel"
              required
              onInvalid={setRequiredMsg}
              onInput={(e) => e.target.setCustomValidity("")}
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
            <label
              className="incident-required-label"
              style={{
                display: "block",
                fontSize: 16,
                fontWeight: 500,
                marginBottom: 8,
                color: "#1a1a1a",
              }}
            >
              Email {reqStar}
            </label>
            <input
              className="incident-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              inputMode="email"
              required
              onInvalid={setRequiredMsg}
              onInput={(e) => e.target.setCustomValidity("")}
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
              <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                Fecha
              </div>
              <input
                className="incident-field"
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
              <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                Hora
              </div>
              <input
                className="incident-field"
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
              className="incident-field"
              value={comments}
              onChange={(e) => {
                userEditedCommentsRef.current = true;
                setComments(e.target.value);
              }}
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

          {/* Guardar información (SIN asterisco) */}
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
              type="submit"
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
      </form>

      {/* MODAL QR */}
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
                type="button"
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