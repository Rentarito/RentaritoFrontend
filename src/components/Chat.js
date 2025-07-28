import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import getSessionId from "../helpers/sessionIdHelper";
import { fetchManualAnswer } from "../helpers/api";

export default function Chat({ machineFolder, onBack }) {
  const [chat, setChat] = useState([
    {
      role: "assistant",
      content: `¡Hola! Bienvenido al asistente virtual de Rentaire.\n\n¿En qué puedo ayudarte en relación a "${machineFolder}"?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [probId, setProbId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const scrollRef = useRef();
  const sessionId = getSessionId();

  // Mantiene el scroll abajo cuando hay mensajes nuevos
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, imageUrl]);

  // Handler envío mensaje
  const sendMessage = async () => {
    const query = input.trim();
    if (!query) return;
    setInput("");
    setChat((old) => [...old, { role: "user", content: query }]);
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      // Crea el historial para enviar a la API
      const history = [...chat, { role: "user", content: query }].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const res = await fetchManualAnswer({
        folder: machineFolder,
        history,
        query,
        probId,
        sessionId,
      });

      setChat((old) => [...old, { role: "assistant", content: res.answer }]);
      setProbId(res.probId || null);
      setImageUrl(res.imageUrls && res.imageUrls.length ? res.imageUrls[0] : null);
    } catch (err) {
      setError("❌ Error: " + (err.message || "No se pudo conectar"));
    }
    setLoading(false);
  };

  // Handler limpiar chat
  const clearChat = () => {
    setChat([
      {
        role: "assistant",
        content: `¡Hola! Bienvenido al asistente virtual de Rentaire.\n\n¿En qué puedo ayudarte en relación a "${machineFolder}"?`,
      },
    ]);
    setInput("");
    setError(null);
    setImageUrl(null);
    setProbId(null);
  };

  return (
  <div className="chat-root">
    {/* Header igual al de MachineSelection, con centrado óptico */}
    <div className="header-selection">
      <button
        className="chat-back"
        onClick={onBack}
        title="Volver"
        style={{
          background: "none",
          border: "none",
          fontSize: "6vw",
          minFontSize: 18,
          maxFontSize: 20,
          color: "#fff",
          marginRight: "2vw",
          cursor: "pointer",
          width: 42, // AJUSTA si usas otro tamaño
          height: 42,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        ⬅
      </button>
      <div className="title-header" style={{
        color: "#fff",
        fontSize: "6vw",
        fontWeight: "bold",
        flex: 1,
        textAlign: "center"
      }}>
        Chatea con Rentaire
      </div>
      {/* Sombra invisible para equilibrar el header */}
      <div
        style={{
          width: 42, // Igual que el botón izquierdo
          height: 42,
          marginLeft: "2vw",
          visibility: "hidden"
        }}
      >
        ⬅
      </div>
    </div>

    {/* Chat area */}
    <div className="chat-area">
      <div className="chat-messages">
        {chat.map((msg, i) => (
          <ChatBubble key={i} message={msg.content} isUser={msg.role === "user"} />
        ))}
        {loading && <ChatBubble message="Pensando..." isUser={false} />}
        {error && <ChatBubble message={error} isUser={false} />}
        {imageUrl && (
          <div className="chat-image-container">
            <img
              src={imageUrl}
              alt="Adjunto bot"
              className="chat-image"
              onClick={() => window.open(imageUrl, "_blank")}
            />
          </div>
        )}
        <div ref={scrollRef} />
      </div>
    </div>

    {/* Input */}
    <div className="chat-input-row">
      <input
        className="chat-input"
        type="text"
        placeholder="Escribe aquí..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        disabled={loading}
        style={{ maxWidth: "60vw" }}
      />
      <button className="chat-clear" onClick={clearChat} title="Limpiar conversación">
        🔄
      </button>
      <button
        className="chat-send"
        onClick={sendMessage}
        disabled={loading || !input.trim()}
      >
        Enviar
      </button>
    </div>
  </div>
);

}
