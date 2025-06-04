"use client"

import Header from "./components/Header"
import Sidebar from "./components/Sidebar"
import ChatInterface from "./components/ChatInterface"
import AvatarCard from "./components/AvatarCard"
import { useChatStore } from "./store/chatStore"
import "./App.scss"

function App() {
  const { showAvatar, toggleAvatar } = useChatStore()

  return (
    <div className="app">
      <Header />
      <div className="main-container">
        <Sidebar />
        <div className="content-container">
          {showAvatar && <AvatarCard onToggleAvatar={toggleAvatar} />}
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}

export default App
