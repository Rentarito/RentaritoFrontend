import React, { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const BACKEND_BASE_URL =
  process.env.REACT_APP_BACKEND_URL || "https://rentaritobackend-swcw.onrender.com";

const INCIDENT_SUBMIT_URL = `${BACKEND_BASE_URL}/incident-submit`;

// (Opcional) si algún día decides validar token en backend, aquí lo tienes listo
const API_TOKEN = process.env.REACT_APP_API_TOKEN || "rentarito123secure";

const CONTACT_LS_KEY = "rentarito_incident_contact_v1";

// ✅ Nota: para volver a selección de máquinas, preferimos hacerlo vía callback (SPA)

function pad2(n) {
  return String(n).padStart(2, "0");
}
function formatDate(d) {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function formatTime(d) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// ISO local sin milisegundos: YYYY-MM-DDTHH:mm:ss
function toLocalIsoNoMs(d) {
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 19);
}

function isImageFile(file) {
  const t = (file?.type || "").toLowerCase();
  if (t.startsWith("image/")) return true;

  const name = (file?.name || "").toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(name);
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

function SuccessScreen({ onBack }) {
  const BLUE = "#0198f1";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Contenido */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%", maxWidth: 520, textAlign: "center" }}>
          <div style={{ fontSize: 34, fontWeight: 900, color: "#111827", marginBottom: 10 }}>
            ¡Confirmado!
          </div>

          <div style={{ fontSize: 18, color: "#6b7280", lineHeight: 1.35, marginBottom: 22 }}>
            Hemos recibido tu solicitud, en breve te contactaremos.
          </div>

          <button
            type="button"
            onClick={onBack}
            style={{
              width: "100%",
              height: 54,
              borderRadius: 28,
              border: "none",
              background: BLUE,
              color: "white",
              fontSize: 18,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 10px 28px rgba(1,152,241,0.25)",
            }}
          >
            Volver a RentAIrito
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IncidentModal({
  open,
  onClose,
  onBackToMachineSelection,
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
  // attachments: [{ file, name, type, previewUrl }]
  const [addedMachines, setAddedMachines] = useState([]);
  const [addMachineError, setAddMachineError] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comments, setComments] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);

  // ENVIAR
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitOk, setSubmitOk] = useState(null);

  // ✅ nuevo: pantalla confirmación
  const [showSuccess, setShowSuccess] = useState(false);

  const formRef = useRef(null);

  // resumen IA
  const userEditedCommentsRef = useRef(false);
  const summaryDoneRef = useRef(false);

  // ====== QR ======
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrError, setQrError] = useState(null);
  const qrCodeScannerRef = useRef(null);
  const prevNativeHandlerRef = useRef(null);

  const revokeAttachments = (attachments = []) => {
    try {
      attachments.forEach((a) => {
        if (a?.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
    } catch {}
  };

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

    setAddedMachines((prevMachines) => {
      prevMachines.forEach((m) => revokeAttachments(m.attachments));
      return [];
    });
    setAddMachineError(null);

    setQrError(null);
    setShowQRModal(false);

    summaryDoneRef.current = false;
    userEditedCommentsRef.current = false;
    setComments("");

    setName("");
    setPhone("");
    setEmail("");
    setSaveInfo(false);

    // reset envío
    setSubmitting(false);
    setSubmitError(null);
    setSubmitOk(null);

    // ✅ reset confirmación
    setShowSuccess(false);

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

  const clearFiles = () => {
    setAttachedFiles([]);
    setFilesLabel("Ningún archivo seleccionado");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddMachine = () => {
    const code = (machineNo || "").trim();
    const fleet = (machineGroupText || "").trim();

    if (!code && !fleet) {
      setAddMachineError(
        "Debes escanear/escribir el código de máquina o indicar un Grupo de Máquina antes de añadir."
      );
      return;
    }

    setAddMachineError(null);

    const display = code ? code : `${machineGroupSelect} - ${fleet}`;

    const attachments = (attachedFiles || []).map((f) => {
      const img = isImageFile(f);
      return {
        file: f,
        name: f?.name || "archivo",
        type: f?.type || "",
        previewUrl: img ? URL.createObjectURL(f) : null,
      };
    });

    const item = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      display,
      machineNo: code || "",
      fleetCode: code ? "" : fleet,
      baseMachine: machineGroupSelect || "",
      attachments,
    };

    setAddedMachines((prev) => [item, ...prev]);

    setMachineNo("");
    setMachineGroupText("");
    clearFiles();
  };

  const handleDeleteMachine = (id) => {
    setAddedMachines((prev) => {
      const toDelete = prev.find((x) => x.id === id);
      if (toDelete) revokeAttachments(toDelete.attachments);
      return prev.filter((x) => x.id !== id);
    });
  };

  const goBackToMachineSelection = () => {
    // 1) Cerramos el modal
    try {
      onClose?.();
    } catch {}

    // 2) Volvemos a la selección sin recargar (App.js controla la pantalla)
    if (typeof onBackToMachineSelection === "function") {
      // microtask para evitar estados intermedios raros
      setTimeout(() => {
        try {
          onBackToMachineSelection();
        } catch {}
      }, 0);
      return;
    }

    // 3) Fallback: recargar manteniendo query params (ej. ?secret=Rentarito.2025)
    const url = `${window.location.pathname}${window.location.search}`;
    try {
      window.location.assign(url);
    } catch {
      window.location.href = url;
    }
  };

  // ✅ ENVIAR REAL
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (submitting) return;

    setSubmitError(null);
    setSubmitOk(null);

    const form = formRef.current;
    if (form && typeof form.reportValidity === "function") {
      const ok = form.reportValidity();
      if (!ok) return;
    }

    if (!Array.isArray(addedMachines) || addedMachines.length === 0) {
      setSubmitError("Debes añadir al menos una máquina antes de enviar.");
      return;
    }

    // Flatten líneas + archivos
    const allFiles = [];
    const lines = [];

    for (const m of addedMachines) {
      const rentalElementNo = (m.machineNo || m.fleetCode || m.display || "").trim();

      const fileIndexes = [];
      const atts = Array.isArray(m.attachments) ? m.attachments : [];

      for (const a of atts) {
        if (a?.file) {
          const idx = allFiles.length;
          allFiles.push(a.file);
          fileIndexes.push(idx);
        }
      }

      lines.push({
        rentalElementNo,
        groupCode: (m.baseMachine || "").trim(),
        fleetCode: (m.fleetCode || "").trim(),
        fileIndexes,
      });
    }

    const cleanComments = (() => {
      const c = (comments || "").trim();
      if (!userEditedCommentsRef.current && c.toLowerCase().includes("generando resumen")) return "";
      return c;
    })();

    const meta = {
      requestType: "AVERIA",
      requestDate: toLocalIsoNoMs(new Date()),
      contact: {
        name: (name || "").trim(),
        phone: (phone || "").trim(),
        email: (email || "").trim(),
      },
      comments: cleanComments,
      lines,
    };

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append("meta", JSON.stringify(meta));
      allFiles.forEach((f, idx) => {
        fd.append("files", f, f?.name || `archivo_${idx}`);
      });

      const resp = await fetch(INCIDENT_SUBMIT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: fd,
      });

      const text = await resp.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (!resp.ok) {
        const msg = data?.error || data?.message || `Error enviando (HTTP ${resp.status})`;
        const details = data?.details || data?.resultMsg || data?.raw;
        throw new Error(details ? `${msg} — ${details}` : msg);
      }

      if (data?.ok === false) {
        const msg = data?.error || "Business Central rechazó la solicitud";
        const details = data?.resultMsg || data?.details || data?.raw;
        throw new Error(details ? `${msg} — ${details}` : msg);
      }

      setSubmitOk(data?.resultMsg || "Incidencia enviada correctamente.");

      // ✅ mostrar pantalla de confirmación
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setSubmitError(err?.message || "Error enviando la incidencia.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // ✅ Si ya se envió OK, mostramos pantalla confirmación
  if (showSuccess) {
    return <SuccessScreen onBack={goBackToMachineSelection} />;
  }

  const SIDE_PAD = 20;

  const setRequiredMsg = (e) => {
    const el = e.target;
    if (el.validity && el.validity.valueMissing) el.setCustomValidity("Completa este campo");
    else el.setCustomValidity("");
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
                    if (typeof window !== "undefined" && typeof window.openNativeQrScanner === "function") {
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

          {/* Adjuntos */}
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
              Adjuntar archivo
            </label>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setAttachedFiles(files);
                  setFilesLabel(files.length ? `${files.length} archivo(s) seleccionado(s)` : "Ningún archivo seleccionado");
                }}
                style={{ flex: 1 }}
              />
              <div style={{ fontSize: 12, color: "#6b7280" }}>{filesLabel}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddMachine}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 24,
              border: "none",
              background: "#111827",
              color: "white",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "0.5px",
              cursor: "pointer",
              marginBottom: 14,
            }}
          >
            AÑADIR MÁQUINA
          </button>

          {addMachineError && (
            <div style={{ color: "red", fontWeight: 700, marginBottom: 16 }}>{addMachineError}</div>
          )}

          {/* Máquinas añadidas */}
          {addedMachines.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              {addedMachines.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: 14,
                    border: "1px solid #e5e7eb",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontWeight: 900, color: "#111827" }}>{m.display}</div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMachine(m.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#ef4444",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      Eliminar
                    </button>
                  </div>

                  {/* Adjuntos preview */}
                  {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {m.attachments.map((a, idx) => {
                        const isImg = !!a.previewUrl;
                        return (
                          <div key={idx} style={{ width: 90 }}>
                            {isImg ? (
                              <img
                                src={a.previewUrl}
                                alt={a.name}
                                style={{
                                  width: 90,
                                  height: 70,
                                  objectFit: "cover",
                                  borderRadius: 10,
                                  border: "1px solid #e5e7eb",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 90,
                                  height: 70,
                                  borderRadius: 10,
                                  border: "1px solid #e5e7eb",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 11,
                                  color: "#374151",
                                  padding: 6,
                                  boxSizing: "border-box",
                                  textAlign: "center",
                                }}
                              >
                                {a.name}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* DATOS CLIENTE */}
          <div
            style={{
              background: "#ffffff",
              marginLeft: -SIDE_PAD,
              marginRight: -SIDE_PAD,
              padding: "22px 24px",
              marginBottom: 18,
              borderTop: "1px solid #e5e7eb",
              borderBottom: "1px solid #e5e7eb",
              fontWeight: 900,
              letterSpacing: "0.5px",
              color: "#1a1a1a",
            }}
          >
            DATOS DEL CLIENTE
          </div>

          {/* Nombre */}
          <div style={{ marginBottom: 18 }}>
            <label
              className="incident-required-label"
              style={{ display: "block", fontSize: 16, fontWeight: 500, marginBottom: 8, color: "#1a1a1a" }}
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
              style={{ display: "block", fontSize: 16, fontWeight: 500, marginBottom: 8, color: "#1a1a1a" }}
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
              style={{ display: "block", fontSize: 16, fontWeight: 500, marginBottom: 8, color: "#1a1a1a" }}
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
              <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 6, fontWeight: 500 }}>Fecha</div>
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
              <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 6, fontWeight: 500 }}>Hora</div>
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

          {/* Mensajes resultado envío */}
          {submitError && (
            <div style={{ marginTop: 16, color: "red", fontSize: 14, fontWeight: 700 }}>{submitError}</div>
          )}
          {submitOk && (
            <div style={{ marginTop: 16, color: "#16a34a", fontSize: 14, fontWeight: 800 }}>{submitOk}</div>
          )}
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
              disabled={submitting}
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
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.75 : 1,
              }}
            >
              {submitting ? "ENVIANDO..." : "ENVIAR"}
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
            <div style={{ color: "#0198f1", marginTop: 12, textAlign: "center", fontWeight: "bold" }}>
              Apunta con la cámara al QR
            </div>
          </div>
        </div>
      )}
    </div>
  );
}