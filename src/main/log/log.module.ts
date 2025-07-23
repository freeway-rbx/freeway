import {join} from 'node:path'
import {ConfigurationLog} from '@main/_config/configuration'
import {Module} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {utilities as nestWinstonModuleUtilities, WinstonModule} from 'nest-winston'
import * as winston from 'winston'
import WinstonDailyRotateFile from 'winston-daily-rotate-file'

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const conf = configService.get<ConfigurationLog>('log')

        const transports = []

        if (conf.isConsoleTransportEnabled) {
          transports.push(new winston.transports.Console({
            level: 'debug',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              nestWinstonModuleUtilities.format.nestLike('Freeway', {
                colors: true,
                prettyPrint: true,
                processId: true,
                appName: false,
              }),
            ),
          }))
        }

        if (conf.isFileTransportEnabled) {
          transports.push(new WinstonDailyRotateFile({
            format: winston.format.combine(
              winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
              }),
              winston.format.json(),
            ),
            level: 'info',
            auditFile: join(conf.directory, 'audit.json'),
            filename: '%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: false,
            maxSize: '20m',
            maxFiles: '7d',
            dirname: conf.directory,
          }))
        }

        return {
          transports,
          // other options, @see https://www.npmjs.com/package/nest-winston
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class LogModule {}
