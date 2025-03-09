import {IpcOn} from '@doubleshot/nest-electron'
import {AppUpdaterService} from '@main/app-updater/app-updater.service'
import {Controller, Get} from '@nestjs/common'

@Controller()
export class AppUpdaterController {
  constructor(private readonly service: AppUpdaterService) {}

  @IpcOn('app:update')
  public async updaterQuitAndInstall(): Promise<void> {
    this.service.updaterQuitAndInstall()
  }

  @Get('/api/app/update-info')
  public async getUpdateInfo() {
    const isUpdateAvailable = this.service.isUpdateAvailable
    let updateInfo = null

    if (isUpdateAvailable) {
      updateInfo = this.service.getUpdateInfo()
    }

    return {
      updateInfo,
      isUpdateAvailable,
    }
  }
}
