import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import machineCache from "../helpers/machineCache";
import getSessionId from "../helpers/sessionIdHelper";
import { fetchMachines } from "../helpers/api";
import "../App.css";

export default function MachineSelection({ onSelectMachine }) {
  // ... tus estados habituales ...
  const [machines, setMachines] = useState([]);
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState(null);

  // Estados para el escáner
  const [showQr, setShowQr] = useState(false);
  const qrRef = useRef(null);
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
        machines.filter(m =>
          m.toLowerCase().includes(input.trim().toLowerCase())
        )
      );
    }
  }, [input, machines]);

  // Inicia el escáner cuando se muestra el modal
  useEffect(() => {
    if (showQr && qrRef.current) {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRef.current.id);
      }
      scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 250,
        },
        (decodedText) => {
          // Parar el escaneo cuando escanee algo
          scannerRef.current.stop().then(() => {
            setShowQr(false);
            scannerRef.current.clear();
            scannerRef.current = null;
            // Buscar máquina:
            const found = machines.find(m => m.toLowerCase().includes(decodedText.toLowerCase()));
            if (found) handleSelect(found);
            else alert("QR no reconocido o máquina no encontrada.");
          });
        },
        (err) => {
          // Puedes mostrar errores aquí si quieres
        }
      ).catch((err) => {
        alert("No se pudo acceder a la cámara");
        setShowQr(false);
      });
    }
    // Limpiar al cerrar el escáner
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current.clear();
          scannerRef.current = null;
        });
      }
    };
    // eslint-disable-next-line
  }, [showQr]); // Solo cuando cambia showQr

  const dropdownIcon = showDropdown
    ? "/assets/ic_arrow_drop_down.svg"
    : "/assets/ic_arrow_right.svg";

  const handleSelect = (machine) => {
    setInput(machine);
    setShowDropdown(false);
    setTimeout(() => onSelectMachine(machine), 300);
  };

  // Cambia el antiguo handleQR para mostrar el escáner
  const handleQR = () => {
    setShowQr(true);
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
      {/* Escáner QR Modal */}
      {showQr && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
          <div id="qr-reader" ref={qrRef} style={{ width: 320, maxWidth: "85vw" }} />
          <button onClick={() => setShowQr(false)} style={{
            marginTop: 20, fontSize: 20, background: "#0198f1", color: "white", border: "none", borderRadius: 8, padding: "10px 18px"
          }}>Cerrar</button>
        </div>
      )}

      <div className="selector-card">
        {/* Header */}
        <div className="header-selection">
          <div className="title-header">Chatea con Rentaire</div>
        </div>

        {/* QR Button */}
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
            style={{ marginLeft: 10, width: 35, height: 35, backgroundColor: "#0198f1" }}
          />
        </div>

        {/* Buscador y desplegable */}
        <div className="search-row">
          <div className="autocomplete-container">
            <input
              type="text"
              className="autocomplete-input"
              placeholder="Buscar máquina"
              value={input}
              ref={inputRef}
              onFocus={() => setShowDropdown(true)}
              onChange={e => setInput(e.target.value)}
              style={{ minWidth: 0 }}
            />
            <button
              className="icon-button"
              style={{ marginLeft: 4, background: "none", border: "none", cursor: "pointer" }}
              onClick={() => setShowDropdown(s => !s)}
              tabIndex={-1}
              aria-label="Abrir selector"
            >
              <img src={dropdownIcon} style={{ width: 28, height: 28 }} alt="Desplegar" />
            </button>
            {/* Dropdown */}
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

        {/* Error */}
        {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
      </div>
    </div>
  );
}
