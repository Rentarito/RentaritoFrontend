import React, { useState, useEffect } from 'react';
import MachineSelection from './components/MachineSelection';
import Chat from './components/Chat';

export default function App() {
  // 1. Hooks SIEMPRE arriba
  const [selectedMachine, setSelectedMachine] = useState(null);

  // 2. useEffect para manejar el botón de atrás del navegador/móvil SIEMPRE arriba
  useEffect(() => {
    const handler = (e) => {
      // Si estamos en el chat, volver a la selección (esto desmonta Chat)
      if (selectedMachine) {
        setSelectedMachine(null);
        // Opcional: añade otro pushState para evitar salir si pulsas atrás más veces
        window.history.pushState(null, "");
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [selectedMachine]);

  // 3. Para entrar al chat, siempre hacemos un pushState antes
  const goToChat = (machine) => {
    window.history.pushState(null, "");
    setSelectedMachine(machine);
  };

  // 4. Revisión del parámetro secreto (después de los hooks)
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

  // 5. Render condicional (como ya tenías)
  return (
    <div style={{ minHeight: "100vh", background: "#f2f5fa" }}>
      {!selectedMachine ? (
        <MachineSelection onSelectMachine={goToChat} />
      ) : (
        <Chat machineFolder={selectedMachine} onBack={() => setSelectedMachine(null)} />
      )}
    </div>
  );
}
