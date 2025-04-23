/// <reference types="vite/client" />
interface ElectronAPI {
  sendAnalyticsEvent: (event: string, params: Record<string, any>) => Promise<void>
  // You can also declare other exposed methods from preload.ts here if needed
}

interface Window {
  electron: ElectronAPI
}