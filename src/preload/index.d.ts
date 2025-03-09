import type {ElectronAPI} from '@electron-toolkit/preload'

interface MyElectron {
  isDev: boolean
  beep: () => void
  appUpdate: () => void
  login: () => void
  logout: () => void
  openExternal: (url: string) => void
  reveal: (path: string = '') => void
  getAccount: () => Promise<object>
  sendMsg: (msg: string) => Promise<string>
  onReplyMsg: (cb: (msg: string) => any) => void
  onIpcMessage: (cb: (msg: {name: string, data: any}) => any) => void
}

declare global {
  interface Window {
    electronApi: ElectronAPI
    electron: MyElectron
    myElectron: MyElectron
    api: {
      foo: () => void
    }
  }
}
