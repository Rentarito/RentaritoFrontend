import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import getSessionId from "../helpers/sessionIdHelper";
import { fetchManualAnswer, fetchHvoStatus } from "../helpers/api";

// ✅ claves sessionStorage (mismas que en MachineSelection)
const ACCESS_MODE_KEY = "rentarito_access_mode"; // "qr" | "list"
const MACHINE_NO_KEY = "rentarito_machine_no";  // ARBMCHNo

function safeGetSession(key, fallback = "") {
  try {
    const v = sessionStorage.getItem(key);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

export default function Chat({ machineFolder, onBack }) {
  const accessMode = safeGetSession(ACCESS_MODE_KEY, "list"); // "qr"|"list"
  const machineNo = safeGetSession(MACHINE_NO_KEY, "");       // QR completo (ARBMCHNo)

  const buildInitialChat = () => {
    const base = [
      {
        role: "assistant",
        content: `¡Hola, soy RentAIrito! Bienvenido al asistente virtual de Rentaire.\n\nEsta conversación será guardada en nuestra base de datos para poder mejorar la calidad de nuestras respuestas y darte una mejor experiencia.\n\n¿En qué puedo ayudarte en relación a "${machineFolder}"?`,
      },
    ];

    // ✅ Mensaje adicional al entrar por LISTA
    if (accessMode === "list") {
      base.push({
        role: "assistant",
        content:
          "Si quiere consultar si su máquina puede utilizar el aceite HVO, escriba el nombre completo de la maquina que aparece en un lateral o vuelva al menú anterior y escanee el código QR de la máquina.",
      });
    }

    return base;
  };

  const [chat, setChat] = useState(buildInitialChat);
  const [input, setInput] = useState("");
  const [probId, setProbId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  // ✅ guardamos el mensaje HVO para reponerlo si el usuario limpia chat
  const [hvoMessage, setHvoMessage] = useState(null);

  const scrollRef = useRef();
  const sessionId = getSessionId();

  // Offset dinámico para que el header no quede detrás del header nativo
  const [headerOffset, setHeaderOffset] = useState(24);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua =
      (typeof navigator !== "undefined" &&
        (navigator.userAgent || navigator.vendor || "")) ||
      "";

    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);

    const IOS_OFFSET = 80;
    const ANDROID_OFFSET = 40;
    const DEFAULT_OFFSET = 40;

    let offset = DEFAULT_OFFSET;
    if (isIOS) offset = IOS_OFFSET;
    else if (isAndroid) offset = ANDROID_OFFSET;

    setHeaderOffset(offset);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

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

  // ✅ NUEVO: si vienes por QR, consulta HVO automáticamente y añade mensaje
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (accessMode !== "qr") return;
      const mn = String(machineNo || "").trim();
      if (!mn) return;

      try {
        const res = await fetchHvoStatus(mn);
        if (cancelled) return;

        if (res?.message) {
          setHvoMessage(res.message);
          setChat((old) => [...old, { role: "assistant", content: res.message }]);
        }
      } catch {
        // si falla, no reventamos el chat
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const base = buildInitialChat();

    // ✅ si ya teníamos mensaje HVO (QR), lo reponemos
    if (accessMode === "qr" && hvoMessage) {
      base.push({ role: "assistant", content: hvoMessage });
    }

    setChat(base);
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
      <div style={{ height: headerOffset, flexShrink: 0 }} />

      <div className="header-selection" style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: 42 }} />
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
