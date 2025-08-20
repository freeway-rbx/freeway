/// <reference types="vite/client" />
interface ElectronAPI {
  sendAnalyticsEvent: (event: string, params: Record<string, any>) => Promise<void>
  appUpdate: () => void
  onIpcMessage: (callback: (message: {name: string, data: any}) => void) => void
  // You can also declare other exposed methods from preload.ts here if needed
}

interface Window {
  electron: ElectronAPI
}
