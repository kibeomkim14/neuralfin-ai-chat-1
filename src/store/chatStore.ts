import { create } from "zustand"
import xiaoiceManager from "../utils/xiaoiceManager"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  thinkingDuration?: number
}

interface ChatState {
  messages: Message[]
  isTyping: boolean
  showAvatar: boolean
  inputValue: string
  thinkingStartTime: number | null
  isAvatarTalking: boolean // New state for avatar talking
  addMessage: (content: string, role: "user" | "assistant", thinkingDuration?: number) => void
  setIsTyping: (typing: boolean) => void
  setShowAvatar: (show: boolean) => void
  toggleAvatar: () => void
  setInputValue: (value: string) => void
  clearMessages: () => void
  startThinking: () => void
  stopThinking: () => number
  sendMessage: (message: string) => Promise<void>
  setIsAvatarTalking: (talking: boolean) => void
  breakAvatarTalking: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isTyping: false,
  showAvatar: true,
  inputValue: "",
  thinkingStartTime: null,
  isAvatarTalking: false,

  addMessage: (content, role, thinkingDuration) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date(),
      ...(thinkingDuration && { thinkingDuration }),
    }
    console.debug(`Adding ${role} message`, "ChatStore", { messageId: newMessage.id, length: content.length })
    set((state) => ({
      messages: [...state.messages, newMessage],
    }))
  },

  setIsTyping: (typing) => set({ isTyping: typing }),
  setShowAvatar: (show) => set({ showAvatar: show }),
  toggleAvatar: () => set((state) => ({ showAvatar: !state.showAvatar })),
  setInputValue: (value) => set({ inputValue: value }),
  clearMessages: () => {
    console.info("Clearing all messages", "ChatStore")
    set({ messages: [] })
  },

  setIsAvatarTalking: (talking) => {
    console.debug(`Avatar talking state changed to ${talking}`, "ChatStore")
    set({ isAvatarTalking: talking })
  },

  breakAvatarTalking: () => {
    const success = xiaoiceManager.breakTalking()
    if (success) {
      console.info("Avatar talking interrupted by user", "ChatStore")
      set({ isAvatarTalking: false })
    }
  },

  startThinking: () => {
    console.debug("Starting thinking timer", "ChatStore")
    return set({
      thinkingStartTime: Date.now(),
      isTyping: true,
    })
  },

  stopThinking: () => {
    const { thinkingStartTime } = get()
    let duration = 0
    if (thinkingStartTime) {
      duration = Math.round((Date.now() - thinkingStartTime) / 1000)
      console.debug(`Stopping thinking timer: ${duration}s`, "ChatStore")
    }
    set({
      isTyping: false,
      thinkingStartTime: null,
    })
    return duration
  },

  sendMessage: async (message: string) => {
    const { addMessage, startThinking, stopThinking, messages } = get()

    if (!message.trim()) return

    // Check if avatar is ready using the manager
    const avatarReady = xiaoiceManager.isXiaoiceReady()
    console.info("Sending message to backend", "ChatStore", {
      messageLength: message.length,
      avatarReady,
    })

    addMessage(message, "user")
    startThinking()

    try {
      const conversationMessages = messages
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
        .concat([{ role: "user", content: message }])

      const response = await fetch("http://localhost:8000/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        body: JSON.stringify({
          messages: conversationMessages,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      let assistantMessage = ""
      const thinkingDuration = stopThinking()
      addMessage("", "assistant", thinkingDuration)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === "text-delta") {
                assistantMessage += data.textDelta
                set((state) => ({
                  messages: state.messages.map((msg, index) =>
                    index === state.messages.length - 1 ? { ...msg, content: assistantMessage } : msg,
                  ),
                }))
              } else if (data.type === "error") {
                throw new Error(data.error)
              }
            } catch (e) {
              console.error("Parse error for line", "ChatStore", { line, error: e })
            }
          }
        }
      }

      // Use the manager to make avatar talk
      if (avatarReady && assistantMessage) {
        try {
          console.info("Sending message to avatar", "ChatStore", {
            messageLength: assistantMessage.length,
          })

          // Add a small delay to ensure the message is fully rendered
          setTimeout(() => {
            xiaoiceManager.talk(assistantMessage)
          }, 500)
        } catch (error) {
          console.error("Error sending message to avatar", "ChatStore", error)
        }
      }
    } catch (error) {
      console.error("Error sending message", "ChatStore", error)
      const thinkingDuration = stopThinking()
      addMessage(
        `I apologize, but I'm having trouble connecting right now. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        "assistant",
        thinkingDuration,
      )
    }
  },
}))
