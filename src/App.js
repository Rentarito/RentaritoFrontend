import React, { useState } from "react";
import MachineSelection from "./components/MachineSelection";
import Chat from "./components/Chat";

export default function App() {
  const [selectedMachine, setSelectedMachine] = useState(null);
  // selectedMachine = { folder, accessMode: "qr"|"list", machineNo?: string }

  const urlParams = new URLSearchParams(window.location.search);
  const secret = urlParams.get("secret");
  if (secret !== "Rentarito.2025") {
    return (
      <div style={{
        padding: 50,
        color: "white",
        background: "#0198f1",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center"
      }}>
        Acceso restringido. Solo puedes entrar desde la app oficial.
      </div>
    );
  }

  return (
    <div className="rentarito-app-root">
      {!selectedMachine ? (
        <MachineSelection onSelectMachine={setSelectedMachine} />
      ) : (
        <Chat
          machineFolder={selectedMachine.folder}
          accessMode={selectedMachine.accessMode}
          machineNo={selectedMachine.machineNo}
          onBack={() => setSelectedMachine(null)}
        />
      )}
    </div>
  );
}
