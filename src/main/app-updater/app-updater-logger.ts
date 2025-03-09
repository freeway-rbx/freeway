import type {Logger as ElectronUpdateLoggerInterface} from 'electron-updater'
import {Logger} from '@nestjs/common'

export class AppUpdaterLogger extends Logger implements ElectronUpdateLoggerInterface {
  info(msg: string, ...args: any[]) {
    return this.log(msg, ...args)
  }
}
