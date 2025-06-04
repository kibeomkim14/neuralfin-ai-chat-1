"use client"

import { useChatStore } from "../store/chatStore"
import "./ChatMessages.scss"

const ChatMessages = () => {
  const { messages, isTyping } = useChatStore()

  return (
    <div className="chat-messages">
      {messages.map((message, index) => (
        <div key={message.id}>
          {/* Show "Thought for x seconds" above AI responses */}
          {message.role === "assistant" && message.thinkingDuration && (
            <div className="thinking-message left-aligned">
              <div className="thinking-text completed">Thought for {message.thinkingDuration}s</div>
            </div>
          )}
          <div className={`message ${message.role}`}>
            <div className="message-content">{message.content}</div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
      ))}
      {isTyping && (
        <div className="thinking-message left-aligned">
          <div className="thinking-text">
            Sandra is thinking
            <span className="thinking-dots">
              <span className="dot">.</span>
              <span className="dot">.</span>
              <span className="dot">.</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatMessages
