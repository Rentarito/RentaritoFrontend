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
  const [qrCodeRaw, setQrCodeRaw] = useState("");
  const [machineNameFromApi, setMachineNameFromApi] = useState("");
  const [notFound, setNotFound] = useState(false);

  const inputRef = useRef();

  // Cargar lista de máquinas
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
    setQrCodeRaw("");
    setMachineNameFromApi("");
    setNotFound(false);
  };

  // Escáner QR
  useEffect(() => {
    const qrRegionId = "qr-reader";
    if (!scanning) return;

    const html5QrCode = new Html5Qrcode(qrRegionId);

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
              setQrCodeRaw(decodedText);
              setScanning(false);
              await html5QrCode.stop();
              document.getElementById(qrRegionId).innerHTML = "";

              try {
                const response = await fetch(
                  `https://businesscentral.rentaire.es:25043/api/route/GetRentalElementFleetCode?p_RentalElement=${encodeURIComponent(
                    JSON.stringify({ rentalElement: decodedText })
                  )}`
                );

                const xmlText = await response.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(xmlText, "application/xml");
                const valueNode = xml.querySelector("Value");
                const folderName = valueNode?.textContent?.trim();

                if (!folderName) {
                  setMachineNameFromApi("");
                  setNotFound(true);
                  return;
                }

                setMachineNameFromApi(folderName);
                setNotFound(false);
              } catch (err) {
                console.error("❌ Error al consultar la API:", err);
                setMachineNameFromApi("");
                setNotFound(true);
              }
            },
            (errorMessage) => {
              console.warn("⚠️ Error escaneando:", errorMessage);
            }
          )
          .catch((err) => {
            console.error("❌ Error al iniciar escáner:", err);
            alert("No se pudo iniciar el escáner.");
            setScanning(false);
          });
      })
      .catch((err) => {
        console.error("❌ Error accediendo a cámara:", err);
        alert("Permiso de cámara denegado o no disponible.");
        setScanning(false);
      });

    return () => {
      html5QrCode.stop().catch(() => {});
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

        {/* Botón de escanear QR */}
        <div className="btn-escanear-qr" tabIndex={0} onClick={handleQR}>
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

        {/* Resultado del QR */}
        {qrCodeRaw && (
          <input
            type="text"
            value={`Código QR escaneado: ${qrCodeRaw}`}
            readOnly
            style={{
              marginTop: "4vw",
              marginLeft: "auto",
              marginRight: "auto",
              padding: "3vw 4vw",
              backgroundColor: "#f2f2f2",
              borderRadius: 12,
              width: "92vw",
              maxWidth: 600,
              fontSize: "4vw",
              color: "#666",
              border: "1.5px solid #ccc",
              textAlign: "center",
            }}
          />
        )}

        {machineNameFromApi && (
          <input
            type="text"
            value={`Máquina detectada: ${machineNameFromApi}`}
            readOnly
            style={{
              marginTop: "2vw",
              marginLeft: "auto",
              marginRight: "auto",
              padding: "3vw 4vw",
              backgroundColor: "#f9f9f9",
              borderRadius: 12,
              width: "92vw",
              maxWidth: 600,
              fontSize: "4vw",
              color: "#333",
              border: "1.5px solid #ccc",
              textAlign: "center",
            }}
          />
        )}

        {notFound && (
          <div
            style={{
              marginTop: "2vw",
              textAlign: "center",
              color: "red",
              fontSize: "4vw",
            }}
          >
            ❌ No se ha encontrado una máquina válida
          </div>
        )}

        {/* Lector QR activo */}
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
                src={dropdownIcon}
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

        {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
      </div>
    </div>
  );
}
