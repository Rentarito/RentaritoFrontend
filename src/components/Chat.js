import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import getSessionId from "../helpers/sessionIdHelper";
import { fetchManualAnswer } from "../helpers/api";

const HEADER_OFFSET_PX = 64; // 👈 ajusta 0, 8, 12... hasta que se vea perfecto

export default function Chat({ machineFolder, onBack }) {
  const [chat, setChat] = useState([
    {
      role: "assistant",
      content: `¡Hola, soy RentAIrito! Bienvenido al asistente virtual de Rentaire.\n\n¿En qué puedo ayudarte en relación a "${machineFolder}"?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [probId, setProbId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const scrollRef = useRef();
  const sessionId = getSessionId();

  // Al entrar en el chat, nos aseguramos de estar arriba del todo
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  // Siempre que cambie el chat o la imagen, hacemos scroll al final
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, imageUrl]);

  // Botón físico "atrás" de Android: volvemos y recargamos
  useEffect(() => {
    const handlePopState = () => {
      if (typeof onBack === "function") {
        onBack();
      }
      if (typeof window !== "undefined" && window.location) {
        window.location.reload();
      }
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
      const history = [...chat, { role: "user", content: query }].map(
        (msg) => ({
          role: msg.role,
          content: msg.content,
        })
      );

      const res = await fetchManualAnswer({
        folder: machineFolder,
        history,
        query,
        probId,
        sessionId,
      });

      setChat((old) => [...old, { role: "assistant", content: res.answer }]);
      setProbId(res.probId || null);
      setImageUrl(
        res.imageUrls && res.imageUrls.length ? res.imageUrls[0] : null
      );
    } catch (err) {
      setError("❌ Error: " + (err.message || "No se pudo conectar"));
    }
    setLoading(false);
  };

  const clearChat = () => {
    setChat([
      {
        role: "assistant",
        content: `¡Hola, soy RentAIrito! Bienvenido al asistente virtual de Rentaire.\n\n¿En qué puedo ayudarte en relación a "${machineFolder}"?`,
      },
    ]);
    setInput("");
    setError(null);
    setImageUrl(null);
    setProbId(null);
  };

  return (
    <div
      className="chat-root"
      style={{
        backgroundImage: "url('/assets/fondoapp.jpg')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        backgroundSize: "cover",
      }}
    >
      {/* 👇 Espaciador para bajar un pelín todo el contenido
          (evita que el header azul se quede tapado por el header nativo) */}
      <div style={{ height: HEADER_OFFSET_PX, flexShrink: 0 }} />

      {/* HEADER IGUAL AL DE MachineSelection, SIN FLECHA */}
      <div
        className="header-selection"
        style={{ display: "flex", alignItems: "center" }}
      >
        <div style={{ width: 42 }} />{" "}
        {/* Espacio a la izquierda, por simetría visual */}
        <div className="title-header" style={{ flex: 1, textAlign: "center" }}>
          Chatea con{" "}
          <span className="brand">
            RentA<span className="brand-i">I</span>rito
          </span>
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
            boxShadow: "none",
          }}
        />
      </div>

      {/* ZONA CENTRAL DEL CHAT – esta es la que tiene scroll */}
      <div className="chat-area">
        <div className="chat-messages">
          {chat.map((msg, i) => (
            <ChatBubble
              key={i}
              message={msg.content}
              isUser={msg.role === "user"}
            />
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

      {/* BARRA DE INPUT – diseño antiguo restaurado */}
      <div
        className="chat-input-row"
        style={{
          padding: "2vw 5vw 2vw 2vw",
          alignItems: "center",
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
            maxWidth: 225,
            fontSize: 20,
            height: 46,
            padding: "0 18px",
            borderRadius: 14,
            border: "2px solid #0198f1",
            marginRight: 0,
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
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
              justifyContent: "center",
              marginLeft: 8,
            }}
          >
            <img
              src="/assets/refrescarNegro.png"
              alt="Limpiar"
              style={{
                width: 30,
                height: 30,
                objectFit: "contain",
                display: "block",
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
              padding: "10px 10px",
              border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              opacity: loading || !input.trim() ? 0.5 : 1,
              transition: "background 0.2s",
              minWidth: 50,
              height: 46,
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
