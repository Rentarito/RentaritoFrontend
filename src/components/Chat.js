import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import getSessionId from "../helpers/sessionIdHelper";
import { fetchManualAnswer, fetchMachineHvo } from "../helpers/api";

export default function Chat({ machineFolder, machineNo, onBack }) {
  const introText = `¡Hola, soy RentAIrito! Bienvenido al asistente virtual de Rentaire.\n\nEsta conversación será guardada en nuestra base de datos para poder mejorar la calidad de nuestras respuestas y darte una mejor experiencia.\n\n¿En qué puedo ayudarte en relación a "${machineFolder}"?`;

  const makeHvoMsgText = (allowed) =>
    allowed
      ? `La maquina ${machineNo} puede utilizar el aceite HVO.`
      : `La maquina ${machineNo} no puede utilizar el aceite HVO.`;

  // Detecta si el usuario está preguntando por HVO (bastante permisivo)
  const isHvoQuestion = (q) => {
    const s = (q || "").toLowerCase();
    return s.includes("hvo") || s.includes("aceite hvo");
  };

  const [chat, setChat] = useState([
    { role: "assistant", content: introText },
  ]);
  const [input, setInput] = useState("");
  const [probId, setProbId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const scrollRef = useRef();
  const sessionId = getSessionId();

  // Cache del resultado HVO para no llamar cada vez si el usuario repite
  const hvoStatusRef = useRef(null); // null = no consultado, true/false = resultado

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

  // Al entrar en el chat, nos aseguramos de estar arriba del todo
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  // Siempre que cambie el chat o la imagen, hacemos scroll al final
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, imageUrl]);

  // Botón físico "atrás" de Android: volvemos y recargamos
  useEffect(() => {
    const handlePopState = () => {
      if (typeof onBack === "function") onBack();
      if (typeof window !== "undefined" && window.location) {
        window.location.reload();
      }
    };

    window.history.pushState(null, "");
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
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
      // ✅ Interceptar preguntas de HVO
      if (isHvoQuestion(query)) {
        if (!machineNo) {
          setChat((old) => [
            ...old,
            {
              role: "assistant",
              content:
                "Para poder comprobar si puede utilizar HVO, necesito el código completo de la máquina (el que viene en el QR). Escanea el QR para entrar o indícame el código completo.",
            },
          ]);
          setLoading(false);
          return;
        }

        let allowed = hvoStatusRef.current;

        // Si aún no se ha consultado, consultamos
        if (allowed === null) {
          const data = await fetchMachineHvo(machineNo);
          allowed = !!data?.hvoAllowed;
          hvoStatusRef.current = allowed;
        }

        setChat((old) => [
          ...old,
          { role: "assistant", content: makeHvoMsgText(allowed) },
        ]);

        setLoading(false);
        return; // 👈 NO llamamos a /ask
      }

      // ------------------------------
      // Flujo normal (manuales / GPT)
      // ------------------------------
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
    setChat([{ role: "assistant", content: introText }]);
    setInput("");
    setError(null);
    setImageUrl(null);
    setProbId(null);
    // No limpiamos el cache HVO (así si preguntan después, no vuelve a consultar)
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
              style={{ width: 30, height: 30, objectFit: "contain", display: "block" }}
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
