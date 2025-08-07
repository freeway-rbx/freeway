import {join} from 'node:path'
import process from 'node:process'
import {app} from 'electron'
import {Configuration} from './configuration'

export const HOME_PATH = app.getPath('home')

export const config: Configuration = {
  main: {
    port: Number.parseInt(process.env.PORT, 10) || 3000,
    host: 'localhost', // use '0.0.0.0' value, if you want to accept connections on other hosts than localhost
  },
  roblox: {
    clientId: '3542170589549758275',
    scope: 'openid profile asset:read asset:write',
  },
  piece: {
    isAutoUpload: false,
    deletedTimeout: 60_000, // ms
    watchDirectory: join(HOME_PATH, 'freeway/files'),
    gltfDirectory: join(HOME_PATH, 'freeway/data/pieces'),
    metadataPath: join(HOME_PATH, 'freeway/data/pieces/meta.json'),
    uploadQueue: {
      delay: 50,
      concurrency: 10,
      retries: 2,
    },
    watcherQueue: {
      delay: 250,
      concurrency: 20,
      retries: 2,
    },
  },
  cors: {
    origin: '*',
    methods: '*',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },
  log: {
    directory: join(HOME_PATH, 'freeway/logs'),
    isFileTransportEnabled: true,
    isConsoleTransportEnabled: true,
  },
}

export function configure() {
  return config as Configuration
}
