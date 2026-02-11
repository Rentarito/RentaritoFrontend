// src/components/Chat.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../App.css";
import ChatBubble from "./ChatBubble";
import getSessionId from "../helpers/sessionIdHelper";
import { fetchManualAnswer, fetchHvoStatus } from "../helpers/api";

export default function Chat({ machineFolder, accessMode, machineNo, onBack }) {
  const sessionId = useMemo(() => getSessionId(), []);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const buildInitialChat = () => {
    const base = [
      {
        role: "assistant",
        content:
          `¡Hola, soy RentAIrito! Bienvenido al asistente virtual de Rentaire.\n\n` +
          `Esta conversación será guardada en nuestra base de datos para poder mejorar la calidad de nuestras respuestas y darte una mejor experiencia.\n\n` +
          `¿En qué puedo ayudarte en relación a "${machineFolder}"?`,
      },
    ];

    // ✅ Mensaje adicional cuando se entra por lista
    if (accessMode === "list") {
      base.push({
        role: "assistant",
        content:
          'Si quiere consultar si su máquina puede utilizar el aceite HVO, escriba el nombre completo de la maquina que aparece en un lateral o vuelva al menú anterior y escanee el código QR de la máquina.',
      });
    }

    return base;
  };

  const [chat, setChat] = useState(buildInitialChat);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [probId, setProbId] = useState(null);

  // Auto-scroll al final
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  // ✅ Al entrar por QR, consultar HVO y añadir mensaje adicional al chat
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (accessMode !== "qr") return;

      const mn = String(machineNo || "").trim();
      if (!mn) return;

      try {
        const res = await fetchHvoStatus(mn);
        if (!cancelled && res?.message) {
          setChat((prev) => [...prev, { role: "assistant", content: res.message }]);
        }
      } catch (e) {
        // Si el backend falla, ya devuelve "no puede" (según lo implementado)
        // Aquí no hacemos nada para no duplicar mensajes.
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [accessMode, machineNo]);

  const historyForBackend = (messages) => {
    // backend espera [{role, content}]
    return (messages || [])
      .filter((m) => m && (m.role === "user" || m.role === "assistant"))
      .map((m) => ({ role: m.role, content: String(m.content || "") }))
      .slice(-20);
  };

  const sendMessage = async () => {
    const text = String(message || "").trim();
    if (!text || loading) return;

    setError(null);
    setLoading(true);

    const userMsg = { role: "user", content: text };
    const nextChat = [...chat, userMsg];
    setChat(nextChat);
    setMessage("");

    try {
      const res = await fetchManualAnswer({
        folder: machineFolder,
        history: historyForBackend(nextChat),
        query: text,
        probId,
        sessionId,
      });

      const answer = String(res?.answer || "").trim() || "No tengo información para responder a eso.";
      setChat((prev) => [...prev, { role: "assistant", content: answer }]);

      if (res?.probId !== undefined) {
        setProbId(res.probId);
      }
    } catch (e) {
      console.error(e);
      setError("Error del servidor. Reintenta más tarde.");
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, ha ocurrido un error. Inténtalo de nuevo." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const clearChat = () => {
    setChat(buildInitialChat());
    setMessage("");
    setError(null);
    setProbId(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleBack = () => {
    try {
      onBack?.();
    } finally {
      // Mantengo el comportamiento que comentaste (Android back)
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  };

  // Manejo de botón atrás (popstate)
  useEffect(() => {
    const handler = (e) => {
      e?.preventDefault?.();
      handleBack();
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="chat-container"
      style={{
        backgroundImage: "url('/assets/fondoapp.jpg')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        backgroundSize: "cover",
      }}
    >
      <div className="chat-card">
        {/* Header */}
        <div className="chat-header" style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={handleBack}
            className="chat-back-button"
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              border: "none",
              background: "transparent",
              fontSize: 26,
              cursor: "pointer",
              color: "#0198f1",
              fontWeight: "bold",
            }}
            aria-label="Volver"
          >
            ‹
          </button>

          <div style={{ flex: 1, textAlign: "center" }}>
            <div className="title-header">
              <span className="brand">
                RentA<span className="brand-i">I</span>rito
              </span>
            </div>
            <div style={{ fontSize: 14, opacity: 0.8, marginTop: 2 }}>
              {machineFolder}
            </div>
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

        {/* Mensajes */}
        <div
          className="chat-messages"
          style={{
            padding: "14px 12px",
            overflowY: "auto",
            height: "calc(100vh - 210px)",
          }}
        >
          {chat.map((m, idx) => (
            <ChatBubble
              key={idx}
              message={m}
              role={m.role}
              content={m.content}
              text={m.content}
            />
          ))}

          {loading && (
            <ChatBubble
              message={{ role: "assistant", content: "Pensando…" }}
              role="assistant"
              content="Pensando…"
              text="Pensando…"
            />
          )}

          <div ref={endRef} />
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: "red", padding: "0 12px 10px 12px", fontWeight: "bold" }}>
            {error}
          </div>
        )}

        {/* Input */}
        <div
          className="chat-input-row"
          style={{
            display: "flex",
            gap: 10,
            padding: "12px",
            borderTop: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(255,255,255,0.92)",
          }}
        >
          <input
            ref={inputRef}
            className="chat-input"
            type="text"
            placeholder="Escribe tu pregunta…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            style={{
              flex: 1,
              borderRadius: 14,
              border: "1px solid #cfd7e6",
              padding: "12px 12px",
              outline: "none",
              fontSize: 16,
            }}
          />

          <button
            onClick={sendMessage}
            disabled={!message.trim() || loading}
            style={{
              borderRadius: 14,
              border: "none",
              background: "#0198f1",
              color: "white",
              fontWeight: "bold",
              padding: "0 14px",
              cursor: !message.trim() || loading ? "not-allowed" : "pointer",
              opacity: !message.trim() || loading ? 0.55 : 1,
              fontSize: 16,
            }}
          >
            Enviar
          </button>

          <button
            onClick={clearChat}
            disabled={loading}
            style={{
              borderRadius: 14,
              border: "1px solid #cfd7e6",
              background: "white",
              color: "#111",
              fontWeight: "bold",
              padding: "0 12px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.55 : 1,
              fontSize: 16,
            }}
            aria-label="Limpiar conversación"
            title="Limpiar conversación"
          >
            🧹
          </button>
        </div>
      </div>
    </div>
  );
}
