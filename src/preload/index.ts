import process from 'node:process'
import {electronAPI} from '@electron-toolkit/preload'
import {contextBridge, ipcRenderer} from 'electron'

const electron = {
  isDev: electronAPI.process.env.NODE_ENV_ELECTRON_VITE === 'development', //  || electronAPI.process.env.NODE_ENV === 'development'
  beep: (): void => ipcRenderer.send('app:beep'),
  appUpdate: (): void => ipcRenderer.send('app:update'),

  reveal: (path: string = '', isOpen = false): void => ipcRenderer.send('reveal', path, isOpen),

  login: (): void => ipcRenderer.send('auth:login'),
  logout: (): void => ipcRenderer.send('auth:logout'),
  openExternal: (url: string): void => ipcRenderer.send('open:external', url),
  getAccount: (): Promise<string> => ipcRenderer.invoke('profile'),

  sendMsg: (msg: string): Promise<string> => ipcRenderer.invoke('msg', msg),
  onReplyMsg: (cb: (msg: string) => any) => ipcRenderer.on('reply-msg', (_, msg: string) => {
    cb(msg)
  }),

  onIpcMessage: (cb: (event: {name: string, data: any}) => any) => {
    const listener = (_, event: {name: string, data: any}) => {
      cb(event)
    }
    ipcRenderer.on('ipc-message', listener)
    // Return a cleanup function
    return () => {
      ipcRenderer.removeListener('ipc-message', listener)
    }
  },
  sendAnalyticsEvent: (event: string, params: Record<string, any>) =>
    ipcRenderer.invoke('ga:send', event, params),
}

// Custom APIs for renderer
// const api = {
//   foo() {
//     return 42
//   },
// }

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electron)
    contextBridge.exposeInMainWorld('electronApi', electronAPI)
    // contextBridge.exposeInMainWorld('api', api)
  }
  catch (error) {
    console.error(error)
  }
}
else {
  globalThis.electronApi = electronAPI
  globalThis.electron = electron
  // globalThis.api = api
}
