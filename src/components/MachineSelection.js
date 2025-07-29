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
  const [scanning, setScanning] = useState(false);
  const [qrCode, setQrCode] = useState("");

  const scannerRef = useRef();
  const inputRef = useRef();
  const scanningStoppedRef = useRef(true); // <-- Nuevo

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
    if (!scanning) return;

    const qrRegionId = "qr-reader";
    let html5QrCode = new Html5Qrcode(qrRegionId, { verbose: false });
    scannerRef.current = html5QrCode;
    scanningStoppedRef.current = false;

    Html5Qrcode.getCameras()
      .then((devices) => {
        const cameraId =
          devices.find((d) => d.label.toLowerCase().includes("back"))?.id ||
          devices[0]?.id;
        if (!cameraId) {
          alert("No se detectó ninguna cámara.");
          setScanning(false);
          scanningStoppedRef.current = true;
          return;
        }
        html5QrCode
          .start(
            cameraId,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
              setQrCode(decodedText);
              try {
                await html5QrCode.stop();
              } catch (e) {}
              scanningStoppedRef.current = true;
              setScanning(false); // <-- SIEMPRE al final
            }
          )
          .catch((err) => {
            setScanning(false);
            scanningStoppedRef.current = true;
            alert("No se pudo iniciar el escáner.");
          });
      })
      .catch(() => {
        setScanning(false);
        scanningStoppedRef.current = true;
        alert("Permiso de cámara denegado o no disponible.");
      });

    // Limpieza: SIEMPRE intenta parar el escáner al desmontar
    return () => {
      if (scannerRef.current && !scanningStoppedRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
        scanningStoppedRef.current = true;
      }
    };
  }, [scanning]);

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
    setScanning(false);
    setTimeout(() => onSelectMachine(machine), 300);
  };

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
          onClick={() => setScanning(true)}
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

        {/* Campo de texto con QR */}
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

        {/* Lector QR solo si está escaneando */}
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

        {/* Buscador manual */}
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

        {/* Error */}
        {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
      </div>
    </div>
  );
}
