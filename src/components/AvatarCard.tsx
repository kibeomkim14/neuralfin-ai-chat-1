"use client"

import { useEffect, useState, useRef } from "react"
import xiaoiceManager, { type XiaoiceStatus } from "../utils/xiaoiceManager"
import "./AvatarCard.scss"

interface AvatarCardProps {
  onToggleAvatar: () => void
}

const AvatarCard = ({ onToggleAvatar }: AvatarCardProps) => {
  const [avatarStatus, setAvatarStatus] = useState<XiaoiceStatus>("offline")
  const [debugInfo, setDebugInfo] = useState<string>("Click 'Start Avatar' to begin")
  const avatarContainerRef = useRef<HTMLDivElement>(null)
  const [userStarted, setUserStarted] = useState(false)

  useEffect(() => {
    // Initialize manager with options
    xiaoiceManager.init({
      subscriptionKey: process.env.NEXT_PUBLIC_XIAOICE_SUBSCRIPTION_KEY || "",
      projectId: process.env.NEXT_PUBLIC_XIAOICE_PROJECT_ID || "",
      mountSelector: ".xiaoice-avatar-mount",
      includeUI: false,
      showDefaultStaticImage: true,
      highQuality: false,
      onStatusChange: (status) => {
        setAvatarStatus(status)
      },
      onDebugInfo: (info) => {
        setDebugInfo(info)
      },
    })

    return () => {
      xiaoiceManager.cleanup()
    }
  }, [])

  // Step 1: Initialize RTC
  const handleStartAvatar = async () => {
    if (userStarted || avatarStatus === "initializing") {
      return
    }

    console.info("User manually started avatar", "AvatarCard")
    setUserStarted(true)
    await xiaoiceManager.startInitialization()
  }

  // Step 2: Start RTC
  const handleStartRTC = () => {
    xiaoiceManager.startRTC()
  }

  const handleRetry = () => {
    console.info("Retrying avatar initialization", "AvatarCard")
    setUserStarted(false)
    xiaoiceManager.cleanup()
  }

  const getStatusColor = () => {
    switch (avatarStatus) {
      case "ready":
        return "#3ceec4"
      case "initialized":
        return "#ffa500"
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
      case "initialized":
        return "Ready"
      case "initializing":
        return "Connecting..."
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
        <div className="xiaoice-avatar-container" ref={avatarContainerRef}>
          <div className="xiaoice-avatar-mount"></div>

          {/* Show Start Button when offline */}
          {!userStarted && avatarStatus === "offline" && (
            <div className="avatar-overlay">
              <div className="avatar-placeholder">
                <div className="placeholder-text">Avatar Ready to Start</div>
                <button className="start-avatar-button" onClick={handleStartAvatar}>
                  Start Avatar
                </button>
              </div>
            </div>
          )}

          {/* Show loading when initializing */}
          {userStarted && avatarStatus === "initializing" && (
            <div className="avatar-overlay">
              <div className="avatar-placeholder">
                <div className="loading-spinner"></div>
                <div className="placeholder-text">Initializing...</div>
              </div>
            </div>
          )}

          {/* Show Start RTC button when initialized but not started */}
          {userStarted && avatarStatus === "initialized" && (
            <div className="avatar-overlay">
              <div className="avatar-placeholder">
                <div className="placeholder-text">RTC Initialized</div>
                <button className="start-avatar-button" onClick={handleStartRTC}>
                  Start RTC
                </button>
              </div>
            </div>
          )}

          {/* Show error state */}
          {userStarted && avatarStatus === "error" && (
            <div className="avatar-overlay">
              <div className="avatar-placeholder error">
                <div className="placeholder-text">Connection Failed</div>
                <button className="retry-button" onClick={handleRetry}>
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>

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
