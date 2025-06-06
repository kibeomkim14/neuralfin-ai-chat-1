"use client"

import type React from "react"
import { useChatStore } from "../store/chatStore"
import "./ChatInput.scss"

interface ChatInputProps {
  onSendMessage: (message: string) => void
}

const ChatInput = ({ onSendMessage }: ChatInputProps) => {
  const { inputValue, setInputValue, isTyping, isAvatarTalking, breakAvatarTalking } = useChatStore()

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

  const handlePauseAvatar = () => {
    breakAvatarTalking()
  }

  // Determine button state
  const showPauseButton = isAvatarTalking
  const isButtonDisabled = isTyping || (!inputValue.trim() && !showPauseButton)

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

          {showPauseButton ? (
            <button type="button" className="pause-button" onClick={handlePauseAvatar} title="Stop Avatar Speaking">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                <rect x="14" y="4" width="4" height="16" fill="currentColor" />
              </svg>
            </button>
          ) : (
            <button type="submit" className="send-button" disabled={isButtonDisabled}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DL_Design_Page__External_-T6p8nseQtp5i2QHF3F1acVoKbPrZpB.png"
                alt="Send"
                width="20"
                height="20"
              />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default ChatInput
