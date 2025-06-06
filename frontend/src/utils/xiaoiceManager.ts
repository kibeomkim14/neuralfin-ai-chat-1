/**
 * XiaoiceManager - A utility to manage Xiaoice RTC and ASR integration
 * Based on the official demo code with enhanced error handling
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
  onTalkingChange?: (isTalking: boolean) => void
}

export type XiaoiceStatus = "offline" | "initializing" | "ready" | "error"

class XiaoiceManager {
  private rtcInstance: any = null
  private asrInstance: any = null
  private status: XiaoiceStatus = "offline"
  private isReady = false
  private isTalking = false
  private options: XiaoiceOptions | null = null
  private signature = ""
  private lastSignatureTime = 0 // Track when signature was obtained
  private signatureValidityMs = 30 * 60 * 1000 // 30 minutes validity
  private initializationTimeout: NodeJS.Timeout | null = null
  private retryCount = 0
  private maxRetries = 3
  private asrConfig = {
    hotword_list: [],
    engine_model_type: "",
  }
  private isCleaningUp = false // Prevent recursive cleanup calls

  constructor() {
    // Make methods available globally
    if (typeof window !== "undefined") {
      ;(window as any).xiaoiceManager = this
      ;(window as any).xiaoiceIsReady = () => this.isReady
      ;(window as any).xiaoiceIsTalking = () => this.isTalking
    }
  }

  /**
   * Initialize the Xiaoice manager with options
   */
  public init(options: XiaoiceOptions): void {
    this.options = options
    this.status = "offline"
    this.isReady = false
    this.isTalking = false
    this.rtcInstance = null
    this.signature = ""
    this.lastSignatureTime = 0
    this.retryCount = 0
    this.isCleaningUp = false

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
    return this.isReady && !!this.rtcInstance && this.status === "ready"
  }

  /**
   * Check if avatar is currently talking
   */
  public isAvatarTalking(): boolean {
    return this.isTalking
  }

  /**
   * Check if signature is still valid
   */
  private isSignatureValid(): boolean {
    if (!this.signature || !this.lastSignatureTime) {
      return false
    }
    const now = Date.now()
    return now - this.lastSignatureTime < this.signatureValidityMs
  }

  /**
   * Get a fresh signature from the API
   */
  private async getFreshSignature(): Promise<string> {
    if (!this.options) {
      throw new Error("No options provided")
    }

    const axios = (window as any).axios
    if (!axios) {
      throw new Error("Axios not loaded")
    }

    this.debugLog("Getting fresh signature...")

    try {
      const signatureResponse = await axios({
        method: "GET",
        url: "https://interactive-virtualhuman.xiaoice.com/openapi/signature/gen",
        headers: {
          "subscription-key": this.options.subscriptionKey,
        },
        timeout: 10000, // 10 second timeout
      })

      if (!signatureResponse.data?.data) {
        throw new Error("Invalid signature response")
      }

      this.signature = signatureResponse.data.data
      this.lastSignatureTime = Date.now()
      this.debugLog("Fresh signature obtained successfully")

      return this.signature
    } catch (error) {
      console.error("Failed to get signature", "XiaoiceManager", error)
      throw new Error(`Signature request failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Perform complete cleanup of all resources
   */
  private performCompleteCleanup(): void {
    // Prevent recursive cleanup calls
    if (this.isCleaningUp) {
      console.warn("Cleanup already in progress, skipping", "XiaoiceManager")
      return
    }

    this.isCleaningUp = true

    try {
      this.debugLog("Performing complete cleanup...")

      // Clear any timeouts
      if (this.initializationTimeout) {
        clearTimeout(this.initializationTimeout)
        this.initializationTimeout = null
      }

      // Reset state first to prevent callbacks from triggering more cleanup
      this.isReady = false
      this.updateTalkingState(false)

      // Destroy RTC instance with all methods
      if (this.rtcInstance) {
        try {
          // Try multiple cleanup methods to ensure complete destruction
          if (typeof this.rtcInstance.breakTalking === "function") {
            this.rtcInstance.breakTalking()
          }
          if (typeof this.rtcInstance.endRTC === "function") {
            this.rtcInstance.endRTC()
          }
          if (typeof this.rtcInstance.destroy === "function") {
            this.rtcInstance.destroy()
          }
        } catch (cleanupError) {
          console.warn("Error during RTC cleanup", "XiaoiceManager", cleanupError)
        }
        this.rtcInstance = null
      }

      // Clean up ASR instance
      if (this.asrInstance) {
        try {
          if (typeof this.asrInstance.stop === "function") {
            this.asrInstance.stop()
          }
        } catch (asrError) {
          console.warn("Error during ASR cleanup", "XiaoiceManager", asrError)
        }
        this.asrInstance = null
      }

      // Clear mount element
      const mountElement = document.querySelector(this.options?.mountSelector || ".xiaoice-avatar-mount")
      if (mountElement) {
        mountElement.innerHTML = ""
      }

      // Clear global references
      if (typeof window !== "undefined") {
        delete (window as any).xiaoiceInstance
        delete (window as any).xiaoiceIsReady
        delete (window as any).xiaoiceIsTalking
      }

      this.debugLog("Complete cleanup finished")
    } catch (error) {
      console.error("Error during complete cleanup", "XiaoiceManager", error)
    } finally {
      this.isCleaningUp = false
    }
  }

  /**
   * Start the complete initialization process and go directly to ready
   */
  public async startComplete(): Promise<boolean> {
    if (!this.options) {
      this.debugLog("No options provided")
      return false
    }

    if (this.status === "initializing") {
      this.debugLog("Already initializing")
      return false
    }

    // Always perform complete cleanup before starting
    this.performCompleteCleanup()

    this.updateStatus("initializing")
    this.debugLog(`Starting complete initialization (attempt ${this.retryCount + 1}/${this.maxRetries})...`)

    // Set initialization timeout
    this.initializationTimeout = setTimeout(() => {
      if (this.status === "initializing") {
        console.error("Initialization timeout", "XiaoiceManager")
        this.debugLog("Initialization timed out after 30 seconds")
        this.handleInitializationError(new Error("Initialization timeout"))
      }
    }, 30000) // 30 second timeout

    try {
      // Check if required objects are available
      if (typeof window === "undefined") {
        throw new Error("Window not available")
      }

      const { RTCInteraction } = window as any
      if (!RTCInteraction) {
        throw new Error("RTCInteraction SDK not loaded")
      }

      // Always get a fresh signature for new initialization
      await this.getFreshSignature()

      // Create RTC instance with enhanced error handling
      const rtcOptions = {
        mountClass: this.options.mountSelector,
        includeUI: !!this.options.includeUI,
        showDefaultStaticImage: !!this.options.showDefaultStaticImage,
        bitrateEnum: "R_1080P",
        projectId: this.options.projectId,
        signature: this.signature,
        onError: (res: any) => {
          console.error("Xiaoice RTC Error", "XiaoiceManager", res)
          this.debugLog(`RTC Error: ${JSON.stringify(res)}`)
          this.handleInitializationError(new Error(`RTC Error: ${JSON.stringify(res)}`))
        },
        onInited: (res: any) => {
          console.info("Xiaoice Initialized", "XiaoiceManager", res)
          this.debugLog("RTC initialized successfully, starting stream...")

          // Clear initialization timeout
          if (this.initializationTimeout) {
            clearTimeout(this.initializationTimeout)
            this.initializationTimeout = null
          }

          this.isReady = true
          this.retryCount = 0 // Reset retry count on success

          // Save ASR config from response
          this.asrConfig = {
            hotword_list: res?.hotword_list || [],
            engine_model_type: res?.engine_model_type || "",
          }

          // Auto-start RTC after successful initialization
          setTimeout(() => {
            if (this.rtcInstance && this.isReady && this.status === "initializing") {
              try {
                this.rtcInstance.startRTC()
                this.debugLog("Auto-starting RTC stream...")
              } catch (error) {
                console.error("Error auto-starting RTC", "XiaoiceManager", error)
                this.handleInitializationError(error)
              }
            }
          }, 1000) // Increased delay for better stability
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
          // Only treat as error if we're not already cleaning up and we were ready
          if (this.status === "ready" && !this.isCleaningUp) {
            this.handleInitializationError(new Error("Stream stopped unexpectedly"))
          }
        },
        onTalkStart: (res: any) => {
          console.info("Avatar started talking", "XiaoiceManager", res)
          this.debugLog("Avatar is speaking...")
          this.updateTalkingState(true)
        },
        onTalkEnd: (res: any) => {
          console.info("Avatar finished talking", "XiaoiceManager", res)
          this.debugLog("Avatar finished speaking")
          this.updateTalkingState(false)
        },
      }

      // Create RTC instance
      console.debug("Creating RTCInteraction with fresh signature", "XiaoiceManager", {
        ...rtcOptions,
        signature: "***hidden***", // Don't log the actual signature
      })

      this.rtcInstance = new RTCInteraction(rtcOptions)

      // Make instance globally available
      ;(window as any).xiaoiceInstance = this.rtcInstance
      ;(window as any).xiaoiceIsReady = () => this.isReady
      ;(window as any).xiaoiceIsTalking = () => this.isTalking

      return true
    } catch (error) {
      this.handleInitializationError(error)
      return false
    }
  }

  /**
   * Handle initialization errors with retry logic
   */
  private handleInitializationError(error: any): void {
    // Prevent recursive error handling during cleanup
    if (this.isCleaningUp) {
      console.warn("Error handling skipped during cleanup", "XiaoiceManager", error)
      return
    }

    console.error("Initialization error", "XiaoiceManager", error)

    // Clear initialization timeout
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout)
      this.initializationTimeout = null
    }

    // Perform complete cleanup
    this.performCompleteCleanup()

    this.retryCount++

    if (this.retryCount < this.maxRetries) {
      this.debugLog(`Initialization failed, retrying in 3 seconds... (${this.retryCount}/${this.maxRetries})`)

      // Auto-retry after a delay
      setTimeout(() => {
        if (this.status === "error" || this.status === "initializing") {
          this.startComplete()
        }
      }, 3000)
    } else {
      this.debugLog(
        `Initialization failed after ${this.maxRetries} attempts: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
      this.updateStatus("error")
      this.retryCount = 0 // Reset for next manual retry
    }
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use startComplete() instead
   */
  public async startInitialization(): Promise<boolean> {
    return this.startComplete()
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated This is now handled automatically in startComplete()
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
      this.handleInitializationError(error)
      return false
    }
  }

  /**
   * Make avatar talk
   */
  public talk(message: string): boolean {
    if (!this.isReady || !this.rtcInstance || this.status !== "ready") {
      console.warn("Cannot talk - RTC not ready", "XiaoiceManager", {
        isReady: this.isReady,
        hasInstance: !!this.rtcInstance,
        status: this.status,
      })
      return false
    }

    try {
      console.info("Avatar talking", "XiaoiceManager", { messageLength: message.length })
      this.rtcInstance.talk(message)
      return true
    } catch (error) {
      console.error("Error making avatar talk", "XiaoiceManager", error)
      this.handleInitializationError(error)
      return false
    }
  }

  /**
   * Make avatar ask a question
   */
  public ask(question: string): boolean {
    if (!this.isReady || !this.rtcInstance || this.status !== "ready") {
      console.warn("Cannot ask - RTC not ready", "XiaoiceManager")
      return false
    }

    try {
      console.info("Avatar asking", "XiaoiceManager", { questionLength: question.length })
      this.rtcInstance.ask(question)
      return true
    } catch (error) {
      console.error("Error making avatar ask", "XiaoiceManager", error)
      this.handleInitializationError(error)
      return false
    }
  }

  /**
   * Break current talking
   */
  public breakTalking(): boolean {
    if (!this.isReady || !this.rtcInstance) {
      console.warn("Cannot break talking - RTC not ready", "XiaoiceManager")
      return false
    }

    try {
      console.info("Breaking avatar talking", "XiaoiceManager")
      this.rtcInstance.breakTalking()
      this.debugLog("Avatar talking interrupted")
      // Manually update talking state since onTalkEnd might not be called
      this.updateTalkingState(false)
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
   * Clean up resources (public method)
   */
  public cleanup(): void {
    this.performCompleteCleanup()
    this.updateStatus("offline")
  }

  /**
   * Manual retry method for UI
   */
  public retry(): Promise<boolean> {
    console.info("Manual retry requested", "XiaoiceManager")
    this.retryCount = 0 // Reset retry count for manual retry
    return this.startComplete()
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
   * Update talking state and notify listeners
   */
  private updateTalkingState(isTalking: boolean): void {
    this.isTalking = isTalking
    console.debug(`Avatar talking state changed to ${isTalking}`, "XiaoiceManager")

    if (this.options?.onTalkingChange) {
      this.options.onTalkingChange(isTalking)
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
