import React, { useEffect, useRef, useState } from "react";
import machineCache from "../helpers/machineCache";
import { fetchMachines } from "../helpers/api";
import "../App.css";
import { Html5Qrcode } from "html5-qrcode";

// URL del backend (la misma que usas en helpers/api.js para /machines y /ask)
const BACKEND_BASE_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://rentaritobackend-swcw.onrender.com";

export default function MachineSelection({ onSelectMachine }) {
  const [machines, setMachines] = useState([]);
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const qrCodeScannerRef = useRef(null);
  const inputRef = useRef();

  // ------------------------------
  // Detectar teclado abierto
  // ------------------------------
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const initialHeightRef = useRef(
    typeof window !== "undefined" ? window.innerHeight : 0
  );
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);
  useEffect(() => {
    const threshold = 120; // px; puedes ajustar este valor si lo necesitas

    const handleResize = () => {
      if (typeof window === "undefined") return;

      const heightDiff = initialHeightRef.current - window.innerHeight;
      const isOpen = heightDiff > threshold;

      setKeyboardOpen(isOpen);

      // Si el teclado se ha cerrado (o el alto vuelve casi a normal),
      // forzamos scroll al principio para que el encabezado no se quede oculto
      if (!isOpen) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ------------------------------

  useEffect(() => {
    async function loadMachines() {
      try {
        let ms = machineCache.machines;
        if (!ms) {
          ms = await fetchMachines();
          machineCache.machines = ms;
        }
        setMachines(ms);
        setFiltered(ms);
      } catch (e) {
        setError("Error cargando máquinas. Reintenta más tarde.");
      }
    }
    loadMachines();
  }, []);

  useEffect(() => {
    if (input.trim() === "") {
      setFiltered(machines);
    } else {
      setFiltered(
        machines.filter((m) =>
          m.toLowerCase().includes(input.trim().toLowerCase())
        )
      );
    }
  }, [input, machines]);

  // Nuevo: Solo pone el nombre en el input, no lanza el chat automáticamente
  const handleSelect = (machine) => {
    setInput(machine);
    setShowDropdown(false);
    // NO lanzamos onSelectMachine aquí
  };

  // ---------------------- FUNCION DE FETCH Y LOGS QR ----------------------
  async function obtenerNombreMaquina(decodedText) {
    try {
      const codigo = decodedText.trim();
      if (!codigo) return "No encontrada";

      const resp = await fetch(`${BACKEND_BASE_URL}/rental-element-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: codigo }),
      });

      if (!resp.ok) {
        console.error(
          "Error respuesta backend nombre máquina:",
          resp.status
        );
        return "Error consultando máquina";
      }

      const data = await resp.json();
      if (data.result) {
        // Aquí llegará "DUMPER", "EXCAVADORA", etc.
        return data.result;
      } else {
        return "No encontrada";
      }
    } catch (err) {
      console.error("Error consultando nombre de máquina:", err);
      return "Error consultando máquina";
    }
  }

  // 👉 Función común para decidir qué hacer con la máquina escaneada
  function handleMachineFromQr(nombreMaquinaCrudo) {
    const nombreNormalizado = (nombreMaquinaCrudo || "").toUpperCase().trim();

    if (!nombreNormalizado) {
      setError("No se ha encontrado una máquina para ese QR.");
      return;
    }

    // Buscamos la máquina en la lista de manera case-insensitive
    const machineFromList = machines.find(
      (m) => m.toUpperCase().trim() === nombreNormalizado
    );

    if (machineFromList) {
      // ✅ Máquina válida: ir DIRECTO al chat
      setError(null);
      onSelectMachine(machineFromList);
    } else {
      // ❌ No está en la lista: dejamos escrito y pedimos que revise
      setInput(nombreNormalizado);
      setError("Selecciona una máquina válida de la lista.");
    }
  }
  
  // ------------------------------ 
  // Función global para QR nativo (Android/iOS app principal)
  // ------------------------------ 
  useEffect(() => {
    // La app nativa llamará a: window.setQrFromNative('<texto QR>');
    window.setQrFromNative = async (decodedText) => {
      if (!decodedText) return;

      try {
        const nombreMaquina = await obtenerNombreMaquina(decodedText);
        handleMachineFromQr(nombreMaquina);
      } catch (e) {
        console.error("Error procesando QR nativo", e);
        setError("Error procesando el QR.");
      }
    };

    return () => {
      delete window.setQrFromNative;
    };
  }, [machines, onSelectMachine]);

  // ---- QR modal logic ----
  useEffect(() => {
    const regionId = "qr-modal-reader";
    if (!showQRModal) {
      // Si ocultas el modal, limpia el escáner
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
          // Comprobamos que haya al menos una cámara
          if (!devices || devices.length === 0) {
            setError("No se detectó ninguna cámara.");
            setShowQRModal(false);
            return;
          }

          html5QrCode
            .start(
              { facingMode: "environment" },
              {
                fps: 10,
                qrbox: function (viewfinderWidth, viewfinderHeight) {
                  const minEdge = Math.min(
                    viewfinderWidth,
                    viewfinderHeight
                  );
                  return { width: minEdge * 0.8, height: minEdge * 0.98 };
                },
              },
              (decodedText) => {
                obtenerNombreMaquina(decodedText).then((nombreMaquina) => {
                  // Cerramos el modal y el escáner SÍ o SÍ
                  setShowQRModal(false);
                  html5QrCode
                    .stop()
                    .then(() => html5QrCode.clear())
                    .catch(() => {});
                  qrCodeScannerRef.current = null;

                  // 👉 Reutilizamos la función común
                  handleMachineFromQr(nombreMaquina);
                });
              },
              (errorMessage) => {
                // Puedes loggear si quieres
              }
            )
            .catch((err) => {
              setError("No se pudo iniciar el escáner.");
              setShowQRModal(false);
              html5QrCode.clear().catch(() => {});
              qrCodeScannerRef.current = null;
            });
        })
        .catch(() => {
          setShowQRModal(false);
        });
    }, 300);

    // Limpieza extra si el componente se desmonta
    return () => {
      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current.stop().catch(() => {});
        qrCodeScannerRef.current.clear().catch(() => {});
        qrCodeScannerRef.current = null;
      }
    };
  }, [showQRModal, machines, onSelectMachine]);

  return (
    <div
      className="machine-selection-container"
      style={{
        backgroundImage: "url('/assets/fondoapp.jpg')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        backgroundSize: "cover",
        // 👈 quitamos backgroundAttachment y minHeight 100vh
      }}
    >
      <div className="selector-card">
        <div
          className="header-selection"
          style={{ display: "flex", alignItems: "center" }}
        >
          <div style={{ width: 42 }} />{" "}
          {/* Espacio a la izquierda, por simetría visual */}
          <div className="title-header" style={{ flex: 1, textAlign: "center" }}>
            Chatea con{" "}
            <span className="brand">
              RentA<span className="brand-i">I</span>rito
            </span>
          </div>
          <img
            src="/assets/rentarito.png"
            alt="Logo Rentaire"
            style={{
              height: "36px",
              width: "36px",
              objectFit: "contain",
              marginRight: "8px",
              marginLeft: "8px",
              background: "transparent",
              borderRadius: "8px",
              boxShadow: "none",
            }}
          />
        </div>

        {/* Botón QR */}
        <div
          className="btn-escanear-qr"
          tabIndex={0}
          onClick={() => {
            // 1️⃣ Si la app nativa ha expuesto su función, usamos SIEMPRE el escáner nativo
            if (
              typeof window !== "undefined" &&
              typeof window.openNativeQrScanner === "function"
            ) {
              window.openNativeQrScanner();
            } else {
              // 2️⃣ Si estamos en un navegador normal (o aún no tienen la función),
              // usamos el escáner HTML5 (Html5Qrcode) como hasta ahora
              setShowQRModal(true);
            }
          }}
          style={{
            marginTop: "10vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0198f1",
            borderRadius: 18,
            padding: "10px 5px",
            cursor: "pointer",
            color: "white",
            fontWeight: "bold",
            fontSize: 18,
            marginBottom: "3vw",
          }}
        >
          Escanear QR de la máquina
          <img
            src="/assets/qr.png"
            alt="QR"
            style={{
              marginLeft: 10,
              width: 35,
              height: 35,
              backgroundColor: "#0198f1",
            }}
          />
        </div>

        {/* Mostrar error del QR si hay */}
        {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}

        {/* --- MODAL QR --- */}
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
                    // PARAR y limpiar el scanner al cerrar el modal de forma segura
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
                id="qr-modal-reader"
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

        {/* Buscador manual */}
        <div className="search-row">
          <div className="autocomplete-container">
            <input
              type="text"
              className="autocomplete-input"
              placeholder="Escriba o seleccione máquina"
              value={input}
              ref={inputRef}
              onFocus={() => {
                setShowDropdown(true);
                setInputFocused(true);
              }}
              onBlur={() => {
                setInputFocused(false);
                if (typeof window !== "undefined") {
                  // Al cerrar el teclado / perder foco, volvemos arriba
                  window.scrollTo(0, 0);
                }
              }}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              style={{ minWidth: 0 }}
            />
            <button
              className="icon-button"
              style={{
                marginLeft: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => setShowDropdown((s) => !s)}
              tabIndex={-1}
              aria-label="Abrir selector"
            >
              <img
                src={
                  showDropdown
                    ? "/assets/ic_arrow_drop_down.svg"
                    : "/assets/ic_arrow_right.svg"
                }
                style={{ width: 28, height: 28 }}
                alt="Desplegar"
              />
            </button>
            {showDropdown && (
              <div className="dropdown">
                {filtered.length === 0 && (
                  <div className="dropdown-item disabled">
                    No hay resultados
                  </div>
                )}
                {filtered.map((machine, idx) => (
                  <div
                    className="dropdown-item"
                    key={machine + idx}
                    onMouseDown={() => handleSelect(machine)}
                  >
                    {machine}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BOTÓN PREGUNTAR ABAJO: solo si el teclado NO está abierto */}
        {!keyboardOpen && (
          <div
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
              padding: "18px 0 24px 0",
              display: "flex",
              justifyContent: "center",
              width: "100vw",
              boxSizing: "border-box",
              pointerEvents: "auto",
              background: "rgba(255,255,255,0)", // transparente
            }}
          >
            <button
              className="btn-escanear-qr"
              style={{
                width: "92vw",
                maxWidth: 600,
                margin: "0 auto",
                fontWeight: "bold",
                fontSize: "18px",
                borderRadius: "16px",
                background: "#0198f1",
                color: "#fff",
                padding: "16px 0",
                boxShadow: "0 4px 18px #dde5fa",
                border: "none",
                cursor: input.trim() ? "pointer" : "not-allowed",
                transition: "background 0.2s",
                opacity: input.trim() ? 1 : 0.5,
              }}
              disabled={!input.trim()}
              onClick={() => {
                // Validación: solo dejar pasar si existe en la lista
                if (machines.includes(input.trim())) {
                  setError(null);
                  onSelectMachine(input);
                } else {
                  setError("Selecciona una máquina válida de la lista.");
                }
              }}
            >
              <span>
                Preguntar a <span className="cambria-text">RentAIrito</span>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
