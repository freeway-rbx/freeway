import {Module} from '@nestjs/common'
import {ConfigModule} from '@nestjs/config'
import {APP_FILTER} from '@nestjs/core'
import {EventEmitterModule} from '@nestjs/event-emitter'
import {ScheduleModule} from '@nestjs/schedule'
import {SentryGlobalFilter, SentryModule} from '@sentry/nestjs/setup'
import {configuration} from './_config/configuration'
import {AnalyticsService} from './analytics/analytics.service'
import {AppUpdaterModule} from './app-updater/app-updater.module'
import {AppController} from './app.controller'
import {AppService} from './app.service'
import {AuthModule} from './auth/auth.module'
import {ElectronModule} from './electron/electron.module'
import {LogModule} from './log/log.module'
import {PieceModule} from './piece/piece.module'
import {PluginModule} from './plugin/plugin.module'
import {RobloxApiModule} from './roblox-api/roblox-api.module'

@Module({
  imports: [
    SentryModule.forRoot(),
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
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    AppService,
    AnalyticsService,
  ],
  exports: [
    AnalyticsService,
  ],
})
export class AppModule {}
