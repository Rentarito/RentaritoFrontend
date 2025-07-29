import React, { useEffect, useRef, useState } from "react";
import machineCache from "../helpers/machineCache";
import getSessionId from "../helpers/sessionIdHelper";
import { fetchMachines } from "../helpers/api";
import "../App.css";
import { Html5Qrcode } from "html5-qrcode";

export default function MachineSelection({ onSelectMachine }) {
  const [machines, setMachines] = useState([]);
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [qrCode, setQrCode] = useState(""); // <--- Aquí se guarda el QR

  const inputRef = useRef();
  const scannerRef = useRef(null);

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

  const dropdownIcon = showDropdown
    ? "/assets/ic_arrow_drop_down.svg"
    : "/assets/ic_arrow_right.svg";

  const handleSelect = (machine) => {
    setInput(machine);
    setShowDropdown(false);
    setScanning(false);
    setTimeout(() => onSelectMachine(machine), 300);
  };

  const handleQR = () => {
    setScanning(true);
  };

  useEffect(() => {
    const qrRegionId = "qr-reader";
    if (!scanning) return;

    const html5QrCode = new Html5Qrcode(qrRegionId);
    scannerRef.current = html5QrCode;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices || devices.length === 0) {
          alert("No se detectó ninguna cámara.");
          setScanning(false);
          return;
        }

        const backCamera = devices.find((d) =>
          d.label.toLowerCase().includes("back")
        );
        const cameraId = backCamera ? backCamera.id : devices[0].id;

        html5QrCode
          .start(
            cameraId,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
              setQrCode(decodedText);
              setScanning(false);
              try {
                await html5QrCode.stop();
              } catch (e) {
                // No pasa nada si falla
              }
              // IMPORTANTE: No toques el innerHTML, deja que React quite el div
            },
            (errorMessage) => {
              // Ignora errores de escaneo continuos
            }
          )
          .catch((err) => {
            alert("No se pudo iniciar el escáner.");
            setScanning(false);
          });
      })
      .catch((err) => {
        alert("Permiso de cámara denegado o no disponible.");
        setScanning(false);
      });

    // Cleanup robusto: siempre para el escáner si cambia el estado
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [scanning]);

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
          onClick={handleQR}
          style={{
            marginTop: "15vw",
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

        {/* Campo QR SOLO LECTURA */}
        <div className="autocomplete-container" style={{ marginTop: "5vw" }}>
          <input
            type="text"
            className="autocomplete-input"
            value={qrCode}
            readOnly
            placeholder="Aquí aparecerá el código QR escaneado"
            style={{
              backgroundColor: "#f4f4f4",
              color: "#0198f1",
              fontWeight: "bold",
            }}
          />
        </div>

        {/* Lector QR */}
        {scanning && (
          <div
            id="qr-reader"
            style={{
              width: "100%",
              maxWidth: 400,
              margin: "0 auto 20px",
              borderRadius: 10,
            }}
          ></div>
        )}

        {/* Buscador */}
        <div className="search-row">
          <div className="autocomplete-container">
            <input
              type="text"
              className="autocomplete-input"
              placeholder="Buscar máquina"
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
                src={dropdownIcon}
                style={{ width: 28, height: 28 }}
                alt="Desplegar"
              />
            </button>
            {showDropdown && (
              <div className="dropdown">
                {filtered.length === 0 && (
                  <div className="dropdown-item disabled">No hay resultados</div>
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

        {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
      </div>
    </div>
  );
}
