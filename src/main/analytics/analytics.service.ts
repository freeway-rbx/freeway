import * as fs from 'node:fs'
import * as path from 'node:path'
import {Injectable, Logger} from '@nestjs/common'
import {app} from 'electron'
import fetch from 'node-fetch'

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)
  private clientId: string

  constructor() {
    this.initClientId()
  }

  private initClientId() {
    const filePath = path.join(app.getPath('userData'), 'ga-client.json')
    if (fs.existsSync(filePath)) {
      this.clientId = JSON.parse(fs.readFileSync(filePath, 'utf-8')).client_id
    }
    else {
      const randomPart = Math.floor(Math.random() * 1e10)
      const timestampPart = Math.floor(Date.now() / 1000)
      this.clientId = `${randomPart}.${timestampPart}`
      fs.writeFileSync(filePath, JSON.stringify({client_id: this.clientId}))
    }
  }

  async sendEvent(eventName: string, params: Record<string, any> = {}) {
    const measurementId = __GA_MEASUREMENT_ID__
    const apiSecret = __GA_API_SECRET__

    if (!measurementId || !apiSecret) {
      this.logger.warn('Google Analytics not configured.')
      return
    }

    try {
      const res = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            client_id: this.clientId,
            events: [
              {
                name: eventName,
                params,
              },
            ],
          }),
        },
      )

      this.logger.log(`GA Event Sent: ${eventName}`, JSON.stringify({client_id: this.clientId, eventName, params}))
      this.logger.log(`Response: ${res.status} - ${await res.text()}`)

      if (!res.ok) {
        this.logger.warn(`GA failed: ${res.status} - ${await res.text()}`)
      }
    }
    catch (err) {
      this.logger.error('GA send error', err)
    }
  }
}
