import { ipcRenderer } from 'electron'

export const sendAnalyticsEvent = (event: string, params: Record<string, any> = {}) => {
  ipcRenderer.invoke('ga:send', event, params)
}