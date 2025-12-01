import React, { useState } from 'react';
import MachineSelection from './components/MachineSelection';
import Chat from './components/Chat';
import machineCache from './helpers/machineCache';

export default function App() {
  // 1. Siempre declara los hooks primero
  const [selectedMachine, setSelectedMachine] = useState(null);

  // 2. Ahora haz el check del parámetro secreto
  const urlParams = new URLSearchParams(window.location.search);
  const secret = urlParams.get('secret');
  if (secret !== 'Rentarito.2025') {
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

  // 3. El resto del render
  return (
    <div className="rentarito-app-root">
      {!selectedMachine ? (
        <MachineSelection onSelectMachine={setSelectedMachine} />
      ) : (
        <Chat
          machineFolder={selectedMachine}
          onBack={() => setSelectedMachine(null)}
        />
      )}
    </div>
  );
}
