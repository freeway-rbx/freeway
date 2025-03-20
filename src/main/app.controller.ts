import process from 'node:process'
import {IpcOn} from '@doubleshot/nest-electron'
import {ConfigurationLog, ConfigurationPiece} from '@main/_config/configuration'
import {RESOURCES_DIR, STUDIO_LINKS_DIR, STUDIO_PLUGINS_DIR} from '@main/utils'
import {Controller, Get} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {Payload} from '@nestjs/microservices'
import {app, shell} from 'electron'

type RevealPayload = [string, boolean] | string

@Controller()
export class AppController {
  constructor(
    private config: ConfigService,
  ) {
  }

  @IpcOn('open:external')
  public async handleOpenExternal(url: string) {
    await shell.openExternal(url)
  }

  @IpcOn('app:beep')
  public ipcBeep() {
    shell.beep() // Just for fun
    return {message: 'bop'}
  }

  @Get('beep')
  public getAppBeep() {
    shell.beep() // Just for fun
    return {message: 'bop'}
  }

  @IpcOn('reveal')
  public async reveal(@Payload() payload: RevealPayload): Promise<void> {
    let path: string
    let isOpen: boolean

    if (Array.isArray(payload)) {
      [path, isOpen] = payload
    }
    else {
      [path, isOpen] = [payload, false]
    }

    if (!path) {
      path = this.config.get<ConfigurationPiece>('piece').watchDirectory
    }

    if (isOpen) {
      await shell.openPath(path)
    }
    else {
      shell.showItemInFolder(path)
    }
  }

  @Get('/')
  public root() {
    return {message: 'hello'}
  }

  @Get('api/test')
  test() {
    return {
      date: new Date(),
      nodeVersion: process.version,
      appVersion: app.getVersion(),
      resourceDir: RESOURCES_DIR,
      studioLinksDir: STUDIO_LINKS_DIR,
      studioPluginsDir: STUDIO_PLUGINS_DIR,
      watchDirectory: this.config.get<ConfigurationPiece>('piece').watchDirectory,
      logsDirectory: this.config.get<ConfigurationLog>('log').directory,
      // 'process.resourcesPath': process.resourcesPath,
      // 'app.getAppPath()': app.getAppPath(),
      // '__dirname': __dirname,
      // 'resourceDirDev': join(__dirname, '../../resources'),
      // 'resourceDirProd': process.resourcesPath,
      // 'studioContentPath': studioContentPath(),
    }
  }
}
