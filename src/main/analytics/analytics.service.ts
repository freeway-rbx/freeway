import {Injectable, Logger} from '@nestjs/common'
import fetch from 'node-fetch'
import {app} from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import {v4 as uuidv4} from 'uuid'
import {ConfigService} from '@nestjs/config'

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)
  private clientId: string

  constructor(private config: ConfigService) {
    this.initClientId()
  }

  private initClientId() {
    const filePath = path.join(app.getPath('userData'), 'ga-client.json')
    if (fs.existsSync(filePath)) {
      this.clientId = JSON.parse(fs.readFileSync(filePath, 'utf-8')).client_id
    } else {
      this.clientId = uuidv4()
      fs.writeFileSync(filePath, JSON.stringify({ client_id: this.clientId }))
    }
  }

  async sendEvent(eventName: string, params: Record<string, any> = {}) {
    const measurementId = this.config.get<string>('GA_MEASUREMENT_ID')
    const apiSecret = this.config.get<string>('GA_API_SECRET')

    if (!measurementId || !apiSecret) {
      this.logger.warn('Google Analytics not configured.')
      return
    }

    try {
      const res = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: this.clientId,
            events: [
              {
                name: eventName,
                params,
              },
            ],
          }),
        }
      )

      if (!res.ok) {
        this.logger.warn(`GA failed: ${res.status} - ${await res.text()}`)
      }
    } catch (err) {
      this.logger.error('GA send error', err)
    }
  }
}
