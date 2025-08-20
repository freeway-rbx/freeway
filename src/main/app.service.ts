import {ElectronService} from '@main/electron/electron.service'
import {RobloxOauthClient} from '@main/roblox-api/roblox-oauth.client'
import {Injectable, Logger, OnModuleInit} from '@nestjs/common'
import {Interval} from '@nestjs/schedule'
import {net} from 'electron'
import isOnline from 'is-online'

@Injectable()
export class AppService implements OnModuleInit {
  private logger = new Logger(AppService.name)
  private isNetOnline = false
  private _isOnline = false
  private isRefreshing = false

  constructor(
    private readonly oauthClient: RobloxOauthClient,
    private readonly electronService: ElectronService
  ) {
    //
  }

  async onModuleInit(): Promise<void> {
    await this.electronService.createWindow()

    this.checkNetIsOnline().then(() => {
      this.checkWebIsOnline()
    })

    // refresh token set on start
    // this.refreshTokens()
    //   .then(() => {
    //     const mainWin = this.electronService.getMainWindow()
    //     if (mainWin) {
    //       mainWin.webContents.send('ipc-message', {name: 'ready'})
    //     }
    //   })
  }

  @Interval(1000)
  protected async checkNetIsOnline() {
    this.isNetOnline = net.isOnline()
    if (!this.isNetOnline) {
      this.isOnline = false
    }
  }

  @Interval(5000)
  protected async checkWebIsOnline() {
    if (this.isNetOnline) {
      this.isOnline = await isOnline()
    }
  }

  // @Interval(10_000) // disabled for now
  protected async refreshTokens() {
    if (!this.isOnline)
      return

    if (this.isRefreshing)
      return

    this.isRefreshing = true
    try {
      await this.oauthClient.refresh()
    }
    catch (err) {
      this.logger.error('Could not refresh token', err)
    }

    this.isRefreshing = false
  }

  set isOnline(isOnline: boolean) {
    if (isOnline && !this._isOnline) {
      this.logger.log('ONLINE')
      this.electronService.getMainWindow()?.webContents.send('ipc-message', {name: 'app:online'})
    }

    if (!isOnline && this._isOnline) {
      this.logger.log('OFFLINE')
      this.electronService.getMainWindow()?.webContents.send('ipc-message', {name: 'app:offline'})
    }

    this._isOnline = isOnline
  }

  get isOnline() {
    return this._isOnline
  }
}
