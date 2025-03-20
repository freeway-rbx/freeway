import {Module} from '@nestjs/common'
import {ConfigModule} from '@nestjs/config'
import {EventEmitterModule} from '@nestjs/event-emitter'
import {ScheduleModule} from '@nestjs/schedule'
import {configuration} from './_config/configuration'
import {AppUpdaterModule} from './app-updater/app-updater.module'
import {AppController} from './app.controller'
import {AppService} from './app.service'
import {AuthModule} from './auth/auth.module'
import {ElectronModule} from './electron/electron.module'
import {LogModule} from './log/log.module'
import {PieceModule} from './piece/piece.module'
import {PluginModule} from './plugin/plugin.module'
import {RobloxApiModule} from './roblox-api/roblox-api.module'
import { FoobarModule } from './foobar/foobar.module';

@Module({
  imports: [
    AppUpdaterModule,
    ElectronModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    LogModule,
    ScheduleModule.forRoot(),
    AuthModule,
    RobloxApiModule,
    PieceModule,
    PluginModule,
    FoobarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
