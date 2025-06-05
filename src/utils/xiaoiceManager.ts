/**
 * XiaoiceManager - A utility to manage Xiaoice RTC and ASR integration
 * Based on the official demo code
 */


interface XiaoiceOptions {
  subscriptionKey: string
  projectId: string
  mountSelector: string
  includeUI?: boolean
  showDefaultStaticImage?: boolean
  highQuality?: boolean
  onStatusChange?: (status: XiaoiceStatus) => void
  onDebugInfo?: (info: string) => void
}

export type XiaoiceStatus = "offline" | "initializing" | "initialized" | "ready" | "error"

class XiaoiceManager {
  private rtcInstance: any = null
  private asrInstance: any = null
  private status: XiaoiceStatus = "offline"
  private isReady = false
  private options: XiaoiceOptions | null = null
  private signature = ""
  private asrConfig = {
    hotword_list: [],
    engine_model_type: "",
  }

  constructor() {
    // Make methods available globally
    if (typeof window !== "undefined") {
      ;(window as any).xiaoiceManager = this
      ;(window as any).xiaoiceIsReady = () => this.isReady
    }
  }

  /**
   * Initialize the Xiaoice manager with options
   */
  public init(options: XiaoiceOptions): void {
    this.options = options
    this.status = "offline"
    this.isReady = false
    this.rtcInstance = null
    this.signature = ""

    console.info("Xiaoice manager initialized with options", "XiaoiceManager", options)
    this.updateStatus("offline")
  }

  /**
   * Get the current status
   */
  public getStatus(): XiaoiceStatus {
    return this.status
  }

  /**
   * Check if Xiaoice is ready
   */
  public isXiaoiceReady(): boolean {
    return this.isReady && !!this.rtcInstance
  }

  /**
   * Start the initialization process
   * Step 1: Get signature and initialize RTC
   */
  public async startInitialization(): Promise<boolean> {
    if (!this.options) {
      this.debugLog("No options provided")
      return false
    }

    if (this.status !== "offline" && this.status !== "error") {
      this.debugLog("Already initializing or ready")
      return false
    }

    this.updateStatus("initializing")
    this.debugLog("Starting initialization...")

    try {
      // Check if required objects are available
      if (typeof window === "undefined") {
        throw new Error("Window not available")
      }

      const { RTCInteraction } = window as any
      const axios = (window as any).axios

      if (!RTCInteraction) {
        throw new Error("RTCInteraction SDK not loaded")
      }

      if (!axios) {
        throw new Error("Axios not loaded")
      }

      // Get signature from API
      this.debugLog("Getting signature...")
      const signatureResponse = await axios({
        method: "GET",
        url: "https://interactive-virtualhuman.xiaoice.com/openapi/signature/gen",
        headers: {
          "subscription-key": this.options.subscriptionKey,
        },
      })

      if (!signatureResponse.data?.data) {
        throw new Error("Failed to get signature")
      }

      this.signature = signatureResponse.data.data
      this.debugLog("Signature obtained, initializing RTC...")

      // Clean up any existing instance
      this.cleanup()

      // Create options exactly like the demo
      const rtcOptions = {
        mountClass: this.options.mountSelector,
        includeUI: !!this.options.includeUI,
        showDefaultStaticImage: !!this.options.showDefaultStaticImage,
        bitrateEnum: this.options.highQuality ? "R_1080P" : "R_720P",
        projectId: this.options.projectId,
        signature: this.signature,
        onError: (res: any) => {
          console.error("Xiaoice Error", "XiaoiceManager", res)
          this.debugLog(`Error: ${JSON.stringify(res)}`)
          this.updateStatus("error")
          this.isReady = false
        },
        onInited: (res: any) => {
          console.info("Xiaoice Initialized", "XiaoiceManager", res)
          this.debugLog("RTC initialized successfully")
          this.updateStatus("initialized")
          this.isReady = true

          // Save ASR config from response (like demo)
          this.asrConfig = {
            hotword_list: res?.hotword_list || [],
            engine_model_type: res?.engine_model_type || "",
          }
        },
        onPlayStream: () => {
          console.info("Avatar stream started", "XiaoiceManager")
          this.debugLog("Stream playing - Avatar is live!")
          this.updateStatus("ready")
        },
        onJoinRoom: () => {
          console.info("Avatar joined room", "XiaoiceManager")
          this.debugLog("Joined room successfully")
        },
        onStopStream: () => {
          console.info("Avatar stream stopped", "XiaoiceManager")
          this.debugLog("Stream stopped")
        },
        onTalkStart: (res: any) => {
          console.info("Avatar started talking", "XiaoiceManager", res)
          this.debugLog("Avatar is speaking...")
        },
        onTalkEnd: (res: any) => {
          console.info("Avatar finished talking", "XiaoiceManager", res)
          this.debugLog("Avatar finished speaking")
        },
      }

      // Create RTC instance
      console.debug("Creating RTCInteraction", "XiaoiceManager", rtcOptions)
      this.rtcInstance = new RTCInteraction(rtcOptions)

      // Make instance globally available
      ;(window as any).xiaoiceInstance = this.rtcInstance

      return true
    } catch (error) {
      console.error("Failed to initialize RTC", "XiaoiceManager", error)
      this.debugLog(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      this.updateStatus("error")
      this.isReady = false
      return false
    }
  }

  /**
   * Start RTC stream
   * Step 2: Start RTC after initialization
   */
  public startRTC(): boolean {
    if (!this.isReady || !this.rtcInstance) {
      this.debugLog("RTC not ready or initialized")
      return false
    }

    try {
      console.info("Starting RTC stream", "XiaoiceManager")
      this.debugLog("Starting RTC stream...")
      this.rtcInstance.startRTC()
      return true
    } catch (error) {
      console.error("Error starting RTC", "XiaoiceManager", error)
      this.debugLog(`Start error: ${error}`)
      this.updateStatus("error")
      return false
    }
  }

  /**
   * Make avatar talk
   */
  public talk(message: string): boolean {
    if (!this.isReady || !this.rtcInstance) {
      console.warn("Cannot talk - RTC not ready", "XiaoiceManager")
      return false
    }

    try {
      console.info("Avatar talking", "XiaoiceManager", { messageLength: message.length })
      this.rtcInstance.talk(message)
      return true
    } catch (error) {
      console.error("Error making avatar talk", "XiaoiceManager", error)
      return false
    }
  }

  /**
   * Make avatar ask a question
   */
  public ask(question: string): boolean {
    if (!this.isReady || !this.rtcInstance) {
      console.warn("Cannot ask - RTC not ready", "XiaoiceManager")
      return false
    }

    try {
      console.info("Avatar asking", "XiaoiceManager", { questionLength: question.length })
      this.rtcInstance.ask(question)
      return true
    } catch (error) {
      console.error("Error making avatar ask", "XiaoiceManager", error)
      return false
    }
  }

  /**
   * Break current talking
   */
  public breakTalking(): boolean {
    if (!this.isReady || !this.rtcInstance) {
      return false
    }

    try {
      this.rtcInstance.breakTalking()
      return true
    } catch (error) {
      console.error("Error breaking talking", "XiaoiceManager", error)
      return false
    }
  }

  /**
   * End RTC session
   */
  public endRTC(): boolean {
    if (!this.isReady || !this.rtcInstance) {
      return false
    }

    try {
      this.rtcInstance.endRTC()
      return true
    } catch (error) {
      console.error("Error ending RTC", "XiaoiceManager", error)
      return false
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    try {
      if (this.rtcInstance) {
        console.info("Destroying RTC instance", "XiaoiceManager")
        this.rtcInstance.destroy()
        this.rtcInstance = null
      }

      if (this.asrInstance) {
        this.asrInstance.stop()
        this.asrInstance = null
      }

      if (typeof window !== "undefined") {
        delete (window as any).xiaoiceInstance
      }

      this.isReady = false
      this.updateStatus("offline")
    } catch (error) {
      console.error("Cleanup error", "XiaoiceManager", error)
    }
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(status: XiaoiceStatus): void {
    this.status = status
    console.info(`Xiaoice status changed to ${status}`, "XiaoiceManager")

    if (this.options?.onStatusChange) {
      this.options.onStatusChange(status)
    }
  }

  /**
   * Log debug info and notify listeners
   */
  private debugLog(info: string): void {
    console.debug(info, "XiaoiceManager")

    if (this.options?.onDebugInfo) {
      this.options.onDebugInfo(info)
    }
  }
}

// Create singleton instance
const xiaoiceManager = new XiaoiceManager()
export default xiaoiceManager
