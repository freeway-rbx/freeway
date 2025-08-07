import {Operation} from '@common/queue/PBetterQueue'
import {ConfigurationPiece} from '@main/_config'
import {Injectable, Logger} from '@nestjs/common'
import {BaseOptions, BasePayload, BaseQueue} from './base.queue'

export type PieceWatcherQueueTask = {
  fullPath: string // deprecated
  dir: string
  name: string
} & BasePayload<PieceWatcherQueueTask>

@Injectable()
export class PieceWatcherQueue extends BaseQueue<PieceWatcherQueueTask> {
  protected readonly logger = new Logger(PieceWatcherQueue.name)

  onError(err: any, payload: PieceWatcherQueueTask, _operation: Operation) {
    this.logger.error(`${err.message}. [attempt#${err.attemptNumber}] #${payload.fullPath} dir: ${payload.dir} ${payload.name}`)
    this.logger.error(err)
  }

  onIdle() {
    this.provider.save().then((_result) => {
      this.logger.log('saved')
    })
  }

  getOptions(): BaseOptions {
    return this.config.get<ConfigurationPiece>('piece').watcherQueue
  }
}
