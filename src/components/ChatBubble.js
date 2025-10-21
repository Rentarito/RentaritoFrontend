import React from "react";

export default function ChatBubble({ message, isUser }) {
  // Renderiza el contenido, envolviendo "RentAIrito" solo en mensajes del bot
  const renderMessage = () => {
    if (typeof message !== "string") return message;   // por si algún día pasas JSX
    if (isUser) return message;                        // no tocamos mensajes del usuario

    // Divide y envuelve cada ocurrencia exacta de "RentAIrito"
    return message.split(/(RentAIrito)/g).map((part, i) =>
      part === "RentAIrito"
        ? <span key={i} className="cambria-text">RentAIrito</span>
        : part
    );
  };

  return (
    <div
      className={`chat-bubble ${isUser ? "user-bubble" : "bot-bubble"}`}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        margin: "6px 0",
      }}
    >
      <div
        style={{
          background: isUser ? "#c7e0fb" : "#0198f1",
          color: isUser ? "#25416A" : "#fff",
          borderRadius: 18,
          padding: "12px 18px",
          maxWidth: 320,
          fontSize: 15,
          fontWeight: 400,
          boxShadow: isUser ? "0 2px 7px #bdd7ee" : "0 2px 7px #d1e3ff",
          alignSelf: isUser ? "flex-end" : "flex-start",
          whiteSpace: "pre-line",
        }}
      >
        {renderMessage()}
      </div>
    </div>
  );
}
