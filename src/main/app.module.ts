import {configure} from '@main/_config'
import {Module} from '@nestjs/common'
import {ConfigModule} from '@nestjs/config'
import {APP_FILTER} from '@nestjs/core'
import {EventEmitterModule} from '@nestjs/event-emitter'
import {ScheduleModule} from '@nestjs/schedule'
import {SentryModule} from '@sentry/nestjs/setup'
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
import {AllExceptionsFilter} from './utils/sentry.filter'

@Module({
  imports: [
    SentryModule.forRoot(),
    AppUpdaterModule,
    ElectronModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configure],
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
      useClass: AllExceptionsFilter,
    },
    AppService,
    AnalyticsService,
  ],
  exports: [
    AnalyticsService,
  ],
})
export class AppModule {}
