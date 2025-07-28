import React, { useEffect, useRef, useState } from "react";
import machineCache from "../helpers/machineCache";
import getSessionId from "../helpers/sessionIdHelper";
import { fetchMachines } from "../helpers/api";
import "../App.css";

// Importa la librería QR
import { Html5Qrcode } from "html5-qrcode";

export default function MachineSelection({ onSelectMachine }) {
  const [machines, setMachines] = useState([]);
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState(null);

  const inputRef = useRef();

  // QR state
  const [showQr, setShowQr] = useState(false);
  const qrRef = useRef(null);
  const scanner = useRef(null);

  // Cambia aquí tu backend render real:
  const backendUrl = "https://rentaritobackend-swcw.onrender.com"; // <--- CAMBIA esto si tu URL es otra

  // Cargar máquinas al iniciar
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

  // Filtra máquinas por texto
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

  // Cambia icono flecha
  const dropdownIcon = showDropdown
    ? "/assets/ic_arrow_drop_down.svg"
    : "/assets/ic_arrow_right.svg";

  // Handler selección máquina
  const handleSelect = (machine) => {
    setInput(machine);
    setShowDropdown(false);
    setTimeout(() => onSelectMachine(machine), 300); // Simula navegación
  };

  // Escanear QR usando la cámara
  const handleQR = () => {
    setShowQr(true);
  };

  // Inicia/detiene el escáner QR al abrir/cerrar modal
  useEffect(() => {
  if (showQr && qrRef.current) {
    scanner.current = new Html5Qrcode(qrRef.current.id);
    scanner.current.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      async (decodedText) => {
        try {
          setShowQr(false);
          if (scanner.current) await scanner.current.stop().then(() => scanner.current.clear());
          // NOTA: console.log es útil en desktop, pero alert siempre muestra en móvil
          alert("[INFO] Código QR leído: " + decodedText);

          // ------- Petición al backend (proxy) ------
          const apiUrl = `${backendUrl}/proxy-qr?rentalElement=${encodeURIComponent(decodedText)}`;
          let response, responseText, result, folderName, found;
          try {
            response = await fetch(apiUrl, {
              method: "GET",
              headers: { "Content-Type": "application/json" }
            });
          } catch (fetchErr) {
            alert("❌ Error de red al consultar backend:\n" + fetchErr.message);
            return;
          }

          try {
            responseText = await response.text();
          } catch (readErr) {
            alert("❌ Error leyendo respuesta del backend:\n" + readErr.message);
            return;
          }

          try {
            result = JSON.parse(responseText);
          } catch {
            result = {};
            alert("❌ El backend no devolvió JSON. Respuesta:\n" + responseText);
            return;
          }

          if (!response.ok) {
            alert(`❌ Código HTTP: ${response.status}\nRespuesta: ${JSON.stringify(result)}`);
            return;
          }

          folderName = result?.Result?.trim() ?? "";
          found = machines.find(m => m.trim().toLowerCase() === folderName.toLowerCase());

          if (!folderName || !found) {
            alert(
              "❌ El QR escaneado no pertenece a ninguna máquina o la máquina no tiene manuales disponibles.\n\n" +
              `API dice: "${folderName}"\nRespuesta completa:\n${JSON.stringify(result)}`
            );
            return;
          }

          // ¡Si llega aquí, todo ok!
          alert("✅ Máquina reconocida: " + folderName);
          handleSelect(found);
        } catch (err) {
          setShowQr(false);
          alert(
            "❌ Error inesperado tras escanear QR:\n" +
            (err && err.message ? err.message : String(err))
          );
        }
      },
      (err) => {
        // Error en el escaneo
        setShowQr(false);
        alert("❌ Error en la lectura del QR (cámara): " + String(err));
      }
    ).catch((e) => {
      setShowQr(false);
      alert("No se pudo acceder a la cámara o el permiso fue denegado.");
    });
  }
  return () => {
    if (scanner.current) {
      scanner.current.stop().then(() => scanner.current.clear());
    }
  };
  // eslint-disable-next-line
}, [showQr, machines]);


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
            style={{ marginLeft: 10, width: 35, height: 35, backgroundColor: "#0198f1"}}
          />
        </div>

        {/* Modal de escáner QR */}
        {showQr && (
          <div style={{
            position: "fixed",
            zIndex: 9999,
            left: 0, top: 0, width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.8)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center"
          }}>
            <div
              id="qr-reader"
              ref={qrRef}
              style={{ width: 300, height: 300, background: "#000" }}
            />
            <button onClick={() => setShowQr(false)} style={{ marginTop: 20, fontSize: 18, padding: "8px 24px", borderRadius: 10 }}>Cerrar</button>
          </div>
        )}

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
