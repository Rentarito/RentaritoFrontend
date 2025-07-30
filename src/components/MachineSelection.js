import React, { useEffect, useRef, useState } from "react";
import machineCache from "../helpers/machineCache";
import { fetchMachines } from "../helpers/api";
import "../App.css";
import { Html5Qrcode } from "html5-qrcode";

export default function MachineSelection({ onSelectMachine }) {
  const [machines, setMachines] = useState([]);
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);

  const qrCodeScannerRef = useRef(null);
  const inputRef = useRef();

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

  const handleSelect = (machine) => {
    setInput(machine);
    setShowDropdown(false);
    setTimeout(() => onSelectMachine(machine), 300);
  };

  // ---------------------- FUNCION DE FETCH Y LOGS QR ----------------------
  async function obtenerNombreMaquina(decodedText) {
    try {
      const codigo = decodedText.trim();
      console.log("[DEBUG] Código QR leído:", JSON.stringify(codigo));

      const jsonParam = JSON.stringify({ rentalElement: codigo });
      const urlParam = encodeURIComponent(jsonParam);
      const url = `https://businesscentral.rentaire.es:25043/api/route/GetRentalElementFleetCode?p_RentalElement=${urlParam}`;

      console.log("[DEBUG] URL generada:", url);

      const response = await fetch(url);
      const text = await response.text();
      console.log("[DEBUG] Respuesta recibida:", text);

      // Intenta parsear como JSON
      let json = {};
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.log("[DEBUG] No es JSON válido");
        return "No encontrada";
      }

      if (json.Result) {
        console.log("[DEBUG] Nombre de máquina encontrado:", json.Result);
        return json.Result;
      } else {
        console.log("[DEBUG] No se encontró el nombre de la máquina en el JSON.");
        return "No encontrada";
      }
    } catch (err) {
      console.error("[ERROR] Al consultar la máquina:", err);
      return "Error consultando máquina";
    }
  }

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
          const backCamera =
            devices.find((d) =>
              d.label.toLowerCase().includes("back")
            ) || devices[0];
          if (!backCamera) {
            setError("No se detectó ninguna cámara.");
            setShowQRModal(false);
            return;
          }
          html5QrCode
            .start(
              backCamera.id,
              {
                fps: 10,
                qrbox: function(viewfinderWidth, viewfinderHeight) {
                  const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                  return { width: minEdge * 0.80, height: minEdge * 0.98 };
                }
              },
              (decodedText) => {
                obtenerNombreMaquina(decodedText).then((nombreMaquina) => {
                  setInput(nombreMaquina || "");
                  setShowDropdown(true);
                  setShowQRModal(false);
                  html5QrCode
                    .stop()
                    .then(() => html5QrCode.clear())
                    .catch(() => {});
                  qrCodeScannerRef.current = null;
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
  }, [showQRModal]);

  return (
    <div
      className="machine-selection-container"
      style={{
        backgroundImage: "url('/assets/fondoapp.jpg')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        minHeight: "100vh",
      }}
    >
      <div className="selector-card">
        <div className="header-selection">
          <div className="title-header">Chatea con Rentaire</div>
        </div>

        {/* Botón QR */}
        <div
          className="btn-escanear-qr"
          tabIndex={0}
          onClick={() => setShowQRModal(true)}
          style={{
            marginTop: "1vw",
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
            marginBottom: "6vw",
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
        {error && (
          <div style={{ color: "red", marginTop: 16 }}>{error}</div>
        )}

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
              <div style={{ color: "#0198f1", marginTop: 12, textAlign: "center", fontWeight: "bold" }}>
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
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => setInput(e.target.value)}
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
      </div>
    </div>
  );
}
