"use client"

import { useEffect, useState } from "react"
import xiaoiceManager, { type XiaoiceStatus } from "../utils/xiaoiceManager"
import { useChatStore } from "../store/chatStore"
import "./AvatarCard.scss"

interface AvatarCardProps {
  onToggleAvatar: () => void
}

const AvatarCard = ({ onToggleAvatar }: AvatarCardProps) => {
  const [avatarStatus, setAvatarStatus] = useState<XiaoiceStatus>("offline")
  const [debugInfo, setDebugInfo] = useState<string>("Click 'Start Avatar' to begin")
  const [userStarted, setUserStarted] = useState(false)
  const { setIsAvatarTalking } = useChatStore()

  useEffect(() => {
    // Initialize manager with options only once
    xiaoiceManager.init({
      subscriptionKey: process.env.NEXT_PUBLIC_XIAOICE_SUBSCRIPTION_KEY || "",
      projectId: process.env.NEXT_PUBLIC_XIAOICE_PROJECT_ID || "",
      mountSelector: ".xiaoice-avatar-mount",
      includeUI: false,
      showDefaultStaticImage: true,
      highQuality: true,
      onStatusChange: (status) => {
        setAvatarStatus(status)
        // Reset userStarted when going back to offline
        if (status === "offline") {
          setUserStarted(false)
        }
      },
      onDebugInfo: (info) => {
        setDebugInfo(info)
      },
      onTalkingChange: (isTalking) => {
        // Update the chat store when avatar talking state changes
        setIsAvatarTalking(isTalking)
      },
    })

    // Check if avatar was already initialized
    const currentStatus = xiaoiceManager.getStatus()
    setAvatarStatus(currentStatus)
    if (currentStatus === "ready") {
      setUserStarted(true)
      setDebugInfo("Avatar is ready")
    }

    // DON'T cleanup when component unmounts - just clear the mount element
    return () => {
      const mountElement = document.querySelector(".xiaoice-avatar-mount")
      if (mountElement) {
        mountElement.innerHTML = ""
      }
      // DON'T call xiaoiceManager.cleanup() here!
    }
  }, [setIsAvatarTalking])

  // Single click to go from offline to ready
  const handleStartAvatar = async () => {
    if (userStarted && avatarStatus === "initializing") {
      return
    }

    console.info("User started avatar - going directly to ready", "AvatarCard")
    setUserStarted(true)
    await xiaoiceManager.startComplete()
  }

  const handleRetry = async () => {
    console.info("User requested retry", "AvatarCard")
    setUserStarted(true)
    await xiaoiceManager.retry()
  }

  const getStatusColor = () => {
    switch (avatarStatus) {
      case "ready":
        return "#3ceec4"
      case "initializing":
        return "#ffa500"
      case "error":
        return "#ff4444"
      default:
        return "#8f8f8f"
    }
  }

  const getStatusText = () => {
    switch (avatarStatus) {
      case "ready":
        return "Live"
      case "initializing":
        return "Starting..."
      case "error":
        return "Error"
      default:
        return "Offline"
    }
  }

  const BackArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  )

  return (
    <div className="avatar-card">
      <div className="avatar-card-header">
        <button className="back-button">
          <BackArrowIcon />
        </button>
        <button className="toggle-avatar-button" onClick={onToggleAvatar}>
          Hide Avatar <EyeIcon />
        </button>
      </div>

      <div className="avatar-background">
        <div className="xiaoice-avatar-mount"></div>

        {/* Show Start Button when offline - now as a full-card overlay */}
        {!userStarted && avatarStatus === "offline" && (
          <div className="full-card-overlay">
            <div className="placeholder-text">AI Advisor Ready to Start!</div>
            <button className="start-avatar-button" onClick={handleStartAvatar}>
              Start AI Advisor Chat
            </button>
          </div>
        )}

        {/* Show loading when initializing */}
        {userStarted && avatarStatus === "initializing" && (
          <div className="full-card-overlay">
            <div className="loading-spinner"></div>
            <div className="placeholder-text">Starting Avatar...</div>
          </div>
        )}

        {/* Show error state */}
        {avatarStatus === "error" && (
          <div className="full-card-overlay error">
            <div className="placeholder-text">Connection Failed</div>
            <button className="retry-button" onClick={handleRetry}>
              Retry
            </button>
          </div>
        )}

        <div className="avatar-status">
          <div className="status-dot" style={{ backgroundColor: getStatusColor() }}></div>
          <span className="status-text">{getStatusText()}</span>
        </div>

        {process.env.NODE_ENV === "development" && debugInfo && <div className="debug-info">{debugInfo}</div>}
      </div>

      <div className="avatar-info">
        <h2 className="avatar-name">Sandra</h2>
        <p className="avatar-title">DL Family Office</p>
      </div>
    </div>
  )
}

export default AvatarCard
