import React, { useEffect, useRef, useState } from "react";
import machineCache from "../helpers/machineCache";
import { fetchMachines } from "../helpers/api";
import "../App.css";
import { BrowserQRCodeReader } from "@zxing/browser";

export default function MachineSelection({ onSelectMachine }) {
  const [machines, setMachines] = useState([]);
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const videoRef = useRef();
  const readerRef = useRef();
  const cleanupTimeout = useRef();
  const inputRef = useRef();

  // Cargar lista de máquinas solo al inicio
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

  // Arranca ZXing solo si scanning=true
  useEffect(() => {
    if (!scanning) return;

    setError(null);
    let cancelled = false;
    let codeReader = new BrowserQRCodeReader();
    readerRef.current = codeReader;

    codeReader
      .decodeOnceFromVideoDevice(undefined, videoRef.current)
      .then((result) => {
        if (cancelled) return;
        setQrCode(result.text);
        // 🟢 NO desmontamos el <video> instantáneamente, esperamos 500ms
        setTimeout(() => setScanning(false), 500);
      })
      .catch((err) => {
        if (cancelled) return;
        setError("No se pudo escanear: " + err.message);
        setTimeout(() => setScanning(false), 500);
      });

    // Cleanup robusto al desmontar
    return () => {
      cancelled = true;
      if (codeReader) {
        try {
          codeReader.reset();
        } catch (e) {}
      }
      cleanupTimeout.current = setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = null;
      }, 300);
    };
  }, [scanning]);

  // Cleanup global si desmonta el componente
  useEffect(() => {
    return () => {
      if (readerRef.current) {
        try {
          readerRef.current.reset();
        } catch (e) {}
      }
      if (cleanupTimeout.current) {
        clearTimeout(cleanupTimeout.current);
      }
    };
  }, []);

  // Filtro del buscador de máquinas
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

        {/* Mostrar error del QR si hay */}
        {error && (
          <div style={{ color: "red", marginTop: 16 }}>{error}</div>
        )}

        {/* Lector QR solo si está escaneando */}
        {scanning && (
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              margin: "0 auto 20px",
              borderRadius: 10,
              background: "#222",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: "100%",
                maxWidth: 400,
                borderRadius: 10,
                background: "#222",
              }}
              autoPlay
              playsInline
              muted
            />
          </div>
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
      </div>
    </div>
  );
}
