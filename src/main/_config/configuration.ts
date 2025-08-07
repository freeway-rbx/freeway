import {CorsOptions} from '@nestjs/common/interfaces/external/cors-options.interface'

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
