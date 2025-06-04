"use client"

import type React from "react"
import { useChatStore } from "../store/chatStore"
import "./ChatInput.scss"

interface ChatInputProps {
  onSendMessage: (message: string) => void
}

const ChatInput = ({ onSendMessage }: ChatInputProps) => {
  const { inputValue, setInputValue, isTyping } = useChatStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isTyping) {
      onSendMessage(inputValue)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Ask me anything related to finance!"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isTyping}
        />
        <div className="chat-input-buttons">
          <button type="button" className="mic-button" disabled={isTyping}>
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DL_Design_Page__External_-P7Bi6Vpr4RsbASVa3FuQ1I4FMlxmKZ.png"
              alt="Microphone"
              width="20"
              height="20"
            />
          </button>
          <button type="submit" className="send-button" disabled={isTyping || !inputValue.trim()}>
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DL_Design_Page__External_-T6p8nseQtp5i2QHF3F1acVoKbPrZpB.png"
              alt="Send"
              width="20"
              height="20"
            />
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatInput
