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
  const [qrCodeRaw, setQrCodeRaw] = useState(""); // 🆕 Nuevo estado

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

  const handleQR = () => {
    console.log("🟡 handleQR fue llamado");
    setScanning(true);
  };

  useEffect(() => {
    const qrRegionId = "qr-reader";
    if (!scanning) return;

    const html5QrCode = new Html5Qrcode(qrRegionId);

    Html5Qrcode.getCameras()
      .then((devices) => {
        console.log("📷 Cámaras detectadas:", devices);
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
              console.log("✅ Código escaneado:", decodedText);
              setQrCodeRaw(decodedText); // 🆕 Guardamos el código leído

              await html5QrCode.stop();
              document.getElementById(qrRegionId).innerHTML = "";
              setScanning(false);

              try {
                const response = await fetch(
                  `https://businesscentral.rentaire.es:25043/api/route/GetRentalElementFleetCode?p_RentalElement=${encodeURIComponent(
                    JSON.stringify({ rentalElement: decodedText })
                  )}`
                );

                const xmlText = await response.text();
                console.log("📄 XML recibido:", xmlText);

                const parser = new DOMParser();
                const xml = parser.parseFromString(xmlText, "application/xml");

                const valueNodes = xml.getElementsByTagName("Value");
                const valueNode =
                  valueNodes.length > 0 ? valueNodes[0] : null;
                const folderName = valueNode?.textContent?.trim();

                console.log("📦 Máquina extraída:", folderName);

                if (!folderName) {
                  alert("La API no devolvió una máquina válida.");
                  return;
                }

                const normalize = (str) =>
                  str.toLowerCase().replace(/\s|-/g, "");
                const folderNorm = normalize(folderName);
                const matched = machines.find(
                  (m) => normalize(m) === folderNorm
                );

                if (!matched) {
                  alert(
                    `La máquina "${folderName}" no está disponible en la aplicación.`
                  );
                  return;
                }

                handleSelect(matched);
              } catch (err) {
                console.error("❌ Error al procesar la respuesta de la API:", err);
                alert("Error al consultar la máquina.");
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
        {/* Encabezado */}
        <div className="header-selection">
          <div className="title-header">Chatea con Rentaire</div>
        </div>

        {/* Botón QR */}
        <div
          className="btn-escanear-qr"
          tabIndex={0}
          onClick={handleQR}
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

        {/* 🆕 Mostrar código escaneado */}
        {qrCodeRaw && (
          <div
            style={{
              marginTop: "4vw",
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
          >
            Código QR leído: <strong>{qrCodeRaw}</strong>
          </div>
        )}

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
