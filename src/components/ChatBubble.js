import React from "react";

export default function ChatBubble({ message, isUser }) {
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
        {message}
      </div>
    </div>
  );
}
