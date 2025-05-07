import {join} from 'node:path'
import process from 'node:process'
import {CorsOptions} from '@nestjs/common/interfaces/external/cors-options.interface'
import {app} from 'electron'

export function configuration() {
  return {
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
      watchDirectory: join(app.getPath('home'), 'freeway/files'),
      gltfDirectory: join(app.getPath('home'), 'freeway/data/pieces'),
      metadataPath: join(app.getPath('home'), 'freeway/data/pieces/meta.json'),
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
      directory: join(app.getPath('home'), 'freeway/logs'),
      isFileTransportEnabled: true,
      isConsoleTransportEnabled: true,
    },

    /*
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432
  }
*/
  } as Configuration
}

export interface ConfigurationRoblox {
  clientId: string
  scope: string
}

export interface ConfigurationMain {
  port: number
  host: string
}

export interface ConfigurationLog {
  isFileTransportEnabled: boolean
  isConsoleTransportEnabled: boolean
  directory: string
}

export interface ConfigurationPiece {
  isAutoUpload: boolean
  deletedTimeout: number
  watchDirectory: string
  gltfDirectory: string
  metadataPath: string
  uploadQueue: {
    delay: number
    concurrency: number
    retries: number
  }
  watcherQueue: {
    delay: number
    concurrency: number
    retries: number
  }
}

export interface ConfigurationCors extends CorsOptions {
}

export interface Configuration {
  main: ConfigurationMain
  log: ConfigurationLog
  roblox: ConfigurationRoblox
  cors: ConfigurationCors
  piece: ConfigurationPiece
}
