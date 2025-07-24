import React, { useEffect, useRef, useState } from "react";
import machineCache from "../helpers/machineCache";
import getSessionId from "../helpers/sessionIdHelper";
import { fetchMachines } from "../helpers/api";
import "../App.css"; // Asegúrate de tener estilos básicos

export default function MachineSelection({ onSelectMachine }) {
  const [machines, setMachines] = useState([]);
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [error, setError] = useState(null);

  const inputRef = useRef();

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

  // Simulación de QR (puedes hacer prompt para pegar código manual)
  const handleQR = () => {
    const code = window.prompt("Pega el código QR de la máquina:");
    if (!code) return;
    // Busca si el QR coincide con el nombre de máquina
    // Puedes adaptar esto a llamar a una API si tienes lógica QR->nombre
    const found = machines.find(m => m.toLowerCase().includes(code.toLowerCase()));
    if (found) handleSelect(found);
    else alert("QR no reconocido o máquina no encontrada.");
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", width: "100vw" }}>
      {/* Fondo fijo detrás */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          backgroundImage: "url('/assets/fondoapp.jpg')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "cover",
          pointerEvents: "none", // para que nunca tape clicks
        }}
      />
      {/* Contenido delante */}
      <div
        className="machine-selection-container"
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          width: "100vw",
        }}
    >
      <div className="selector-card">
        {/* Header */}
        <div className="header-selection">
          <div className="title-header">Chatea con Rentaire</div>
        </div>

        {/* QR Button: lo movemos encima del buscador */}
        <div
          className="btn-escanear-qr"
          tabIndex={0}
          onClick={handleQR}
          style={{
            marginTop: "30vw",
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
  </div>
  );
}
