import {IpcOn} from '@doubleshot/nest-electron'
import {ConfigurationPiece} from '@main/_config/configuration'
import {Controller, Get} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {Payload} from '@nestjs/microservices'
import {shell} from 'electron'

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
  public async reveal(@Payload() path: string = ''): Promise<void> {
    if (path) {
      shell.showItemInFolder(path)
    }
    else {
      const path = this.config.get<ConfigurationPiece>('piece').watchDirectory
      await shell.openPath(path)
    }
  }

  @Get('/')
  public root() {
    return {message: 'hello'}
  }
}
