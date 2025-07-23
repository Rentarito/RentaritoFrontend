import React, { useState } from 'react';
import MachineSelection from './components/MachineSelection';
import Chat from './components/Chat';
import machineCache from './helpers/machineCache';

export default function App() {
  const [selectedMachine, setSelectedMachine] = useState(null);

  // Al seleccionar máquina, cambiamos a la pantalla de chat
  return (
    <div style={{ minHeight: "100vh", background: "#f2f5fa" }}>
      {!selectedMachine ? (
        <MachineSelection onSelectMachine={setSelectedMachine} />
      ) : (
        <Chat machineFolder={selectedMachine} onBack={() => setSelectedMachine(null)} />
      )}
    </div>
  );
}
