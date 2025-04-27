export const sendAnalyticsEvent = async (event: string, params: Record<string, any> = {}) => {
  try {
    await window.electron.sendAnalyticsEvent(event, params)
  } catch (error) {
    console.error('[Analytics] Failed to send event:', event, error)
  }
}

// extend this as needed
export enum AnalyticsEvent {
  LoadedPieces = 'loaded_pieces'
}