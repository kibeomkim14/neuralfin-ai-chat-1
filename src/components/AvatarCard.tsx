"use client"

import { useEffect, useState } from "react"
import "./AvatarCard.scss"

interface AvatarCardProps {
  onToggleAvatar: () => void
}

const AvatarCard = ({ onToggleAvatar }: AvatarCardProps) => {
  const [avatarStatus, setAvatarStatus] = useState<"initializing" | "ready" | "error" | "offline">("offline")
  const [rtcInstance, setRtcInstance] = useState<any>(null)

  useEffect(() => {
    initializeAvatar()
    return () => {
      // Cleanup on unmount
      if (rtcInstance) {
        rtcInstance.destroy()
      }
    }
  }, [])

  const initializeAvatar = async () => {
    if (typeof window === "undefined") return

    setAvatarStatus("initializing")

    try {
      // Get environment variables
      const subscriptionKey = process.env.NEXT_PUBLIC_XIAOICE_SUBSCRIPTION_KEY
      const projectId = process.env.NEXT_PUBLIC_XIAOICE_PROJECT_ID

      if (!subscriptionKey || !projectId) {
        console.error("Missing Xiaoice credentials")
        setAvatarStatus("error")
        return
      }

      // Generate signature
      const axios = (window as any).axios
      if (!axios) {
        console.error("Axios not loaded")
        setAvatarStatus("error")
        return
      }

      const signatureResponse = await axios({
        url: "https://interactive-virtualhuman.xiaoice.com/openapi/signature/gen",
        headers: {
          "subscription-key": subscriptionKey,
        },
      })

      const signature = signatureResponse.data.data

      // Initialize RTC
      const { RTCInteraction } = window as any
      if (!RTCInteraction) {
        console.error("RTCInteraction not loaded")
        setAvatarStatus("error")
        return
      }

      const options = {
        mountClass: ".xiaoice-avatar-container",
        includeUI: false,
        showDefaultStaticImage: false,
        bitrateEnum: "R_720P",
        projectId: projectId,
        signature: signature,
        onError: (res: any) => {
          console.error("Xiaoice Error:", res)
          setAvatarStatus("error")
        },
        onInited: (res: any) => {
          console.log("Xiaoice Initialized:", res)
          setAvatarStatus("ready")
          // Start RTC automatically
          if (rtcInstance) {
            rtcInstance.startRTC()
          }
        },
        onPlayStream: () => {
          console.log("Avatar stream started")
        },
        onJoinRoom: () => {
          console.log("Avatar joined room")
        },
        onTalkStart: (res: any) => {
          console.log("Avatar started talking:", res)
        },
        onTalkEnd: (res: any) => {
          console.log("Avatar finished talking:", res)
        },
      }

      const instance = new RTCInteraction(options)
      setRtcInstance(instance)

      // Make instance globally available for chat store
      ;(window as any).xiaoiceInstance = instance
    } catch (error) {
      console.error("Failed to initialize avatar:", error)
      setAvatarStatus("error")
    }
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
        return "Connecting..."
      case "error":
        return "Offline"
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
        {/* Xiaoice Avatar Container */}
        <div className="xiaoice-avatar-container"></div>

        {/* Avatar Status Indicator */}
        <div className="avatar-status">
          <div className="status-dot" style={{ backgroundColor: getStatusColor() }}></div>
          <span className="status-text">{getStatusText()}</span>
        </div>
      </div>

      <div className="avatar-info">
        <h2 className="avatar-name">Sandra</h2>
        <p className="avatar-title">DL Family Office</p>
      </div>
    </div>
  )
}

export default AvatarCard
