import {setTimeout as delay} from 'node:timers/promises'
import {ElectronService} from '@main/electron/electron.service'
import {Injectable, OnModuleInit} from '@nestjs/common'
import {Interval, Timeout} from '@nestjs/schedule'
import electronUpdater, {AppUpdater, UpdateInfo} from 'electron-updater'
import {AppUpdaterLogger} from './app-updater-logger'

@Injectable()
export class AppUpdaterService implements OnModuleInit {
  private logger = new AppUpdaterLogger(AppUpdaterService.name)

  private updateInfo: UpdateInfo = null
  private isUpdateDownloaded = false

  private autoUpdater: AppUpdater

  constructor(
    private readonly electronService: ElectronService,
  ) {
    this.autoUpdater = electronUpdater.autoUpdater
  }

  async onModuleInit(): Promise<void> {
    this.autoUpdater.logger = this.logger

    this.autoUpdater.autoDownload = true
    this.autoUpdater.autoRunAppAfterInstall = true

    // `forceDevUpdateConfig = true` is needed for test mostly, if disable then
    // you will see "Skip checkForUpdates because application is not packed and dev update config is not forced"
    this.autoUpdater.forceDevUpdateConfig = true

    this.autoUpdater.setFeedURL({
      provider: 'github',
      updaterCacheDirName: 'freeway',
      owner: 'freeway-rbx',
      repo: 'freeway',
    })

    this.autoUpdater.on('update-available', (updateInfo) => {
      this.logger.log('---- UPDATE AVAILABLE ----', updateInfo)

      this.updateInfo = updateInfo

      this.isUpdateDownloaded = false
    })

    this.autoUpdater.on('download-progress', (info) => {
      this.logger.debug(`---- UPDATE DOWNLOAD PROGRESS ---- ${info.percent}`)
    })

    this.autoUpdater.on('update-downloaded', () => {
      this.logger.debug(`---- UPDATE DOWNLOADED ---- `)
      this.isUpdateDownloaded = true

      this.sendIpcEvent()
    })
  }

  sendIpcEvent() {
    if (!this.isUpdateAvailable) {
      return
    }

    this.electronService.getMainWindow()?.webContents.send('ipc-message', {
      name: 'app-updater:update-available',
      data: this.updateInfo,
    })
  }

  updaterQuitAndInstall() {
    this.logger.log('Updater QuitAndInstall')
    this.autoUpdater.quitAndInstall()
  }

  @Timeout(10_000)
  protected async timeoutCheckForUpdate(): Promise<void> {
    await this.checkForUpdate()
  }

  @Interval(120_000)
  protected async intervalCheckForUpdate(): Promise<void> {
    await this.checkForUpdate()
  }

  get isUpdateAvailable() {
    return this.updateInfo !== null && this.isUpdateDownloaded
  }

  getUpdateInfo(): UpdateInfo {
    return this.updateInfo
  }

  @Interval(20_000)
  protected async intervalFlashFrameCheckForUpdate(): Promise<void> {
    if (this.isUpdateAvailable) {
      this.electronService.getMainWindow()?.flashFrame(true)
      this.sendIpcEvent()
      await delay(10_000)
      this.electronService.getMainWindow()?.flashFrame(false)
    }
  }

  protected async checkForUpdate(): Promise<void> {
    // if (this.isUpdateAvailable) {
    //   return
    // }
    //
    await this.autoUpdater.checkForUpdatesAndNotify()
  }
}
