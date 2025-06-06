"use client"

import { useEffect } from "react"
import Header from "./components/Header"
import Sidebar from "./components/Sidebar"
import ChatInterface from "./components/ChatInterface"
import AvatarCard from "./components/AvatarCard"
import { useChatStore } from "./store/chatStore"
import xiaoiceManager from "./utils/xiaoiceManager"
import "./App.scss"

function App() {
  const { showAvatar, toggleAvatar } = useChatStore()

  // Only cleanup when the entire app unmounts
  useEffect(() => {
    return () => {
      console.info("App unmounting - performing complete cleanup", "App")
      xiaoiceManager.cleanup()
    }
  }, [])

  return (
    <div className="app">
      <Header />
      <div className="main-container">
        <Sidebar />
        <div className={`content-container ${!showAvatar ? "avatar-hidden" : ""}`}>
          {showAvatar && <AvatarCard onToggleAvatar={toggleAvatar} />}
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}

export default App
