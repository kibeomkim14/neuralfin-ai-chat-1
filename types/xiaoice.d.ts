declare global {
    interface Window {
      RTCInteraction: any
      AsrSDK: any
    }
  }
  
  export interface XiaoiceConfig {
    mountClass?: string
    includeUI?: boolean
    showDefaultStaticImage?: boolean
    bitrateEnum?: "R_720P" | "R_1080P"
    projectId?: string
    exclusiveVirtualHumanId?: string
    signature: string
    onError?: (res: any) => void
    onInited?: (res: any) => void
    onPlayStream?: () => void
    onJoinRoom?: () => void
    onStopStream?: () => void
    onTalkStart?: (res: any) => void
    onTalkEnd?: (res: any) => void
  }
  
  export interface XiaoiceInstance {
    startRTC: () => void
    talk: (message: string) => void
    ask: (question: string) => void
    talkByAudio: (audioUrl: string) => void
    breakTalking: () => void
    endRTC: () => void
    destroy: () => void
  }
  
  export interface SignatureResponse {
    data: {
      data: string
    }
  }
  