"use client"

import { useEffect, useRef } from "react"
import SuggestionCards from "./SuggestionCards"
import ChatInput from "./ChatInput"
import ChatMessages from "./ChatMessages"
import { useChatStore } from "../store/chatStore"
import "./ChatInterface.scss"
import { EyeIcon } from "./Sidebar"

const ChatInterface = () => {
  const { messages, inputValue, setInputValue, sendMessage, showAvatar, toggleAvatar } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestions = [
    "I'm planning to retire in 15 years - how should I adjust my portfolio to meet that goal?",
    "How can I make my portfolio more resilient to inflation?",
    "I just received a large bonus - what's the smartest way to invest it?",
    "Is now a good time to invest in emerging markets, or should I wait?",
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return
    setInputValue("")
    await sendMessage(message)
  }

  const hasMessages = messages.length > 0

  return (
    <div className={`chat-interface ${!showAvatar ? "full-width" : ""}`}>
      <div className="chat-header">
        {!showAvatar && (
          <button className="see-avatar-button" onClick={toggleAvatar}>
            See avatar <EyeIcon />
          </button>
        )}
      </div>

      <div className="chat-content">
        {!hasMessages ? (
          <>
            <h1 className="chat-title">What do you want to discuss?</h1>
            <p className="chat-subtitle">
              If you have no idea what to ask AI advisor,
              <br />
              click one of the questions below to engage!
            </p>
            <SuggestionCards suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
          </>
        ) : (
          <ChatMessages />
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  )
}

export default ChatInterface
