/* eslint-disable perfectionist/sort-imports */
import './sentry' // This should always be first!

import type {MicroserviceOptions} from '@nestjs/microservices'
import process from 'node:process'
import {ElectronIpcTransport} from '@doubleshot/nest-electron'
import {platform} from '@electron-toolkit/utils'
import {ValidationPipe} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {NestFactory} from '@nestjs/core'
import {app as electronApp, ipcMain} from 'electron'
import {json, urlencoded} from 'express'
import {WINSTON_MODULE_NEST_PROVIDER} from 'nest-winston'
import {ConfigurationCors, ConfigurationMain} from './_config/configuration'
import {AnalyticsService} from './analytics/analytics.service'
import {AppModule} from './app.module'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

async function bootstrap() {
  try {
    await electronApp.whenReady()

    const nestApp = await NestFactory.create(AppModule, {
      bufferLogs: true,
    })

    nestApp.useLogger(nestApp.get(WINSTON_MODULE_NEST_PROVIDER))

    const config = nestApp.get(ConfigService)

    nestApp.enableCors(config.get<ConfigurationCors>('cors'))
    nestApp.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    )

    nestApp.use(json({limit: '250mb'}))
    nestApp.use(urlencoded({extended: true, limit: '250mb'}))

    // global middleware
    // nestApp.use((req, res, next) => {
    //   console.log('global middleware');
    //   next();
    // })

    nestApp.connectMicroservice<MicroserviceOptions>({
      strategy: new ElectronIpcTransport('IpcTransport'),
    })

    nestApp.enableShutdownHooks()
    await nestApp.startAllMicroservices()

    const mainConfig = config.get<ConfigurationMain>('main')
    await nestApp.listen(mainConfig.port, mainConfig.host)

    const analytics = nestApp.get(AnalyticsService)

    ipcMain.handle('ga:send', async (_event, eventName: string, params: Record<string, any>) => {
      await analytics.sendEvent(eventName, params)
    })

    const isDev = !electronApp.isPackaged
    electronApp.on('window-all-closed', async () => {
      if (!platform.isMacOS) {
        await nestApp.close()
        electronApp.quit()
      }
    })

    if (platform.isWindows) {
      // @see https://stackoverflow.com/questions/65859634/notification-from-electron-shows-electron-app-electron
      const capitalizedAppName = String(electronApp.name).charAt(0).toUpperCase() + String(electronApp.name).slice(1)
      electronApp.setAppUserModelId(capitalizedAppName)
    }

    if (isDev) {
      if (platform.isWindows) {
        process.on('message', async (data) => {
          if (data === 'graceful-exit') {
            await nestApp.close()
            electronApp.quit()
          }
        })
      }
      else {
        process.on('SIGTERM', async () => {
          await nestApp.close()
          electronApp.quit()
        })
      }
    }
  }
  catch (error) {
    console.log(error)
    electronApp.quit()
  }
}

bootstrap()
