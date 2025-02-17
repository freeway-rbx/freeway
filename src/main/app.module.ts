import {Module, RequestMethod} from '@nestjs/common'
import {ConfigModule} from '@nestjs/config'
import {EventEmitterModule} from '@nestjs/event-emitter'
import {ScheduleModule} from '@nestjs/schedule'
import {LoggerModule} from 'nestjs-pino'
import pino from 'pino'
import {configuration} from './_config/configuration'
import {AppController} from './app.controller'
import {AppService} from './app.service'
import {AuthModule} from './auth/auth.module'
import {ElectronModule} from './electron/electron.module'
import {PieceModule} from './piece/piece.module'
import {PluginModule} from './plugin/plugin.module'
import {RobloxApiModule} from './roblox-api/roblox-api.module'
import {TestModule} from './test/test.module'

@Module({
  imports: [
    LoggerModule.forRoot({
      prettyPrint: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'hostname,pid',
      },
      useLevelLabels: true,
      pinoHttp: {
        transport: {
          targets: [
            {
              target: 'pino-roll',
              options: {file: './pino-roll.log', frequency: 'hourly', mkdir: true},
            },
            {
              level: 'trace',
              target: 'pino-pretty',
              options: {},
            },
          ],
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      exclude: '*',

    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    TestModule,
    RobloxApiModule,
    PieceModule,
    PluginModule,
    ElectronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
