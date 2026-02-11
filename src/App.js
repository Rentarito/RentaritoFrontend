import React, { useState } from "react";
import MachineSelection from "./components/MachineSelection";
import Chat from "./components/Chat";
import "./App.css";

export default function App() {
  const [selected, setSelected] = useState(null);
  // selected = { folder, accessMode: "qr"|"list", machineNo? }

  const urlParams = new URLSearchParams(window.location.search);
  const secret = urlParams.get("secret");

  if (secret !== "Rentarito.2025") {
    return (
      <div
        style={{
          padding: 50,
          color: "white",
          background: "#0198f1",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        Acceso restringido. Solo puedes entrar desde la app oficial.
      </div>
    );
  }

  const handleSelectMachine = (sel) => {
    // Compatibilidad: si llega string (viejo)
    if (typeof sel === "string") {
      setSelected({ folder: sel, accessMode: "list" });
      return;
    }

    // Si llega objeto (nuevo)
    if (sel && typeof sel === "object") {
      setSelected({
        folder: sel.folder,
        accessMode: sel.accessMode || "list",
        machineNo: sel.machineNo || "",
      });
      return;
    }
  };

  return (
    <div className="rentarito-app-root">
      {!selected ? (
        <MachineSelection onSelectMachine={handleSelectMachine} />
      ) : (
        <Chat
          machineFolder={selected.folder}
          accessMode={selected.accessMode}
          machineNo={selected.machineNo}
          onBack={() => setSelected(null)}
        />
      )}
    </div>
  );
}
