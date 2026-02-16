import React from "react";

export default function ChatBubble({
  message,
  isUser,
  showCreateIncident = false,
  onCreateIncident,
}) {
  const renderMessage = () => {
    if (typeof message !== "string") return message;
    if (isUser) return message;

    return message.split(/(RentAIrito)/g).map((part, i) =>
      part === "RentAIrito" ? (
        <span key={i} className="cambria-text">
          RentAIrito
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        margin: "6px 0",
      }}
    >
      <div
        className={`chat-bubble ${isUser ? "user-bubble" : "bot-bubble"}`}
        style={{
          display: "flex",
          justifyContent: isUser ? "flex-end" : "flex-start",
          width: "100%",
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

      {!isUser && showCreateIncident && (
        <button
          type="button"
          onClick={onCreateIncident || (() => console.log("Crear avería (pendiente)"))}
          style={{
            marginTop: 8,
            borderRadius: 12,
            padding: "10px 12px",
            border: "1px solid #ffb366",
            background: "#ffe6cc",
            color: "#8a4b00",
            fontWeight: 700,
            cursor: "pointer",
            maxWidth: 320,
          }}
        >
          Crear avería
        </button>
      )}
    </div>
  );
}
