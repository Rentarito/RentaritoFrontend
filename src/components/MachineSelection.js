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

  const dropdownIcon = showDropdown
    ? "/assets/ic_arrow_drop_down.svg"
    : "/assets/ic_arrow_right.svg";

  const handleSelect = (machine) => {
    setInput(machine);
    setShowDropdown(false);
    setScanning(false);
    setTimeout(() => onSelectMachine(machine), 300);
  };

  const handleQR = async () => {
    console.log("🟡 handleQR fue llamado");

    const qrRegionId = "qr-reader";
    const html5QrCode = new Html5Qrcode(qrRegionId);

    try {
      const devices = await Html5Qrcode.getCameras();
      console.log("📷 Cámaras disponibles:", devices);

      if (!devices || devices.length === 0) {
        alert("No se detectó ninguna cámara.");
        return;
      }

      const cameraId = devices[0].id;
      setScanning(true);

      html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText, decodedResult) => {
          console.log("✅ Código QR leído:", decodedText);

          await html5QrCode.stop();
          document.getElementById(qrRegionId).innerHTML = "";
          setScanning(false);

          try {
            const response = await fetch(
              `https://businesscentral.rentaire.es:25043/api/route/GetRentalElementFleetCode?p_RentalElement=${encodeURIComponent(
                JSON.stringify({ rentalElement: decodedText })
              )}`
            );

            const result = await response.json();
            const folderName = result.Result?.trim();
            console.log("📁 Resultado de API:", folderName);

            if (!folderName || !machines.includes(folderName)) {
              alert(
                "El QR no pertenece a una máquina válida o no hay manuales disponibles."
              );
              return;
            }

            handleSelect(folderName);
          } catch (err) {
            console.error("❌ Error consultando la máquina:", err);
            alert("Error consultando la máquina.");
          }
        },
        (errorMessage) => {
          console.warn("⚠️ Error escaneando QR:", errorMessage);
        }
      );
    } catch (err) {
      console.error("❌ Error accediendo a la cámara:", err);
      alert(
        "No se pudo acceder a la cámara. Verifica que el navegador tiene permisos y estás en HTTPS."
      );
    }
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

        {/* Escáner QR activo */}
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

        {/* Error */}
        {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
      </div>
    </div>
  );
}
