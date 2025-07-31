import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import getSessionId from "../helpers/sessionIdHelper";
import { fetchManualAnswer } from "../helpers/api";

export default function Chat({ machineFolder, onBack }) {
  const [chat, setChat] = useState([
    {
      role: "assistant",
      content: `¡Hola, soy Rentarito! Bienvenido al asistente virtual de Rentaire.\n\n¿En qué puedo ayudarte en relación a "${machineFolder}"?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [probId, setProbId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const scrollRef = useRef();
  const sessionId = getSessionId();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, imageUrl]);

  // SOLUCIÓN: Siempre al pulsar atrás, vuelve a selección
  useEffect(() => {
    const handlePopState = (event) => {
      if (onBack) onBack();
      window.history.pushState(null, ""); // Evita salir de la app en pulsaciones sucesivas
    };

    window.history.pushState(null, "");
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onBack]);

  const sendMessage = async () => {
    const query = input.trim();
    if (!query) return;
    setInput("");
    setChat((old) => [...old, { role: "user", content: query }]);
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
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

  const clearChat = () => {
    setChat([
      {
        role: "assistant",
        content: `¡Hola, soy Rentarito! Bienvenido al asistente virtual de Rentaire.\n\n¿En qué puedo ayudarte en relación a "${machineFolder}"?`,
      },
    ]);
    setInput("");
    setError(null);
    setImageUrl(null);
    setProbId(null);
  };

  return (
    <div className="chat-root">
      {/* HEADER IGUALADO A MachineSelection */}
      <div className="header-selection">
        <button
          className="chat-back"
          onClick={onBack}
          title="Volver"
          style={{
            width: 56,
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <img
            src="/assets/flecha.png"
            alt="Volver"
            style={{
              width: 40,
              height: 40,
              objectFit: "contain",
              display: "block"
            }}
          />
        </button>
        <div className="title-header" style={{ flex: 1, textAlign: "center" }}>
          Chatea con Rentarito
        </div>
        <img
          src="/assets/rentarito.png"
          alt="Logo Rentaire"
          style={{
            height: "36px",
            width: "36px",
            objectFit: "contain",
            marginRight: "8px",
            marginLeft: "8px",
            background: "transparent",
            borderRadius: "8px",
            boxShadow: "none"
          }}
        />
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
      <div
        className="chat-input-row"
        style={{
          padding: "2vw 5vw 2vw 2vw",
          alignItems: "center",
          gap: 8,
          display: "flex",
          background: "#f8fbff",
          minHeight: 62,
        }}
      >
        <input
          className="chat-input"
          type="text"
          placeholder="Escribe aquí..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
          style={{
            flex: "1 1 0",
            maxWidth: 180,           // <--- Ajusta este valor según pantalla
            fontSize: 20,
            height: 46,
            padding: "0 18px",
            borderRadius: 14,
            border: "2px solid #0198f1",
            marginRight: 0,
            boxSizing: "border-box"
          }}
        />
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          <button
            className="chat-clear"
            onClick={clearChat}
            title="Limpiar conversación"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              height: 46,
              width: 46,
              justifyContent: "center"
            }}
          >
            <img
              src="/assets/refrescarNegro.png"
              alt="Limpiar"
              style={{
                width: 30,
                height: 30,
                objectFit: "contain",
                display: "block"
              }}
            />
          </button>
          <button
            className="chat-send"
            style={{
              marginRight: 0,
              borderRadius: 16,
              fontWeight: "bold",
              fontSize: "20px",
              background: "#0198f1",
              color: "#fff",
              padding: "10px 28px",
              border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              opacity: loading || !input.trim() ? 0.5 : 1,
              transition: "background 0.2s",
              minWidth: 84,
              height: 46
            }}
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
