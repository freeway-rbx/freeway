import {Module} from '@nestjs/common'
import {AppUpdaterController} from './app-updater.controller'
import {AppUpdaterService} from './app-updater.service'

@Module({
  providers: [AppUpdaterService],
  controllers: [AppUpdaterController],
})
export class AppUpdaterModule {}
