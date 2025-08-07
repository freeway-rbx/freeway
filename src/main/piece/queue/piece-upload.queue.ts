import {Operation} from '@common/queue/PBetterQueue'
import {ConfigurationPiece} from '@main/_config'
import {Injectable, Logger} from '@nestjs/common'
import {BaseQueue} from './base.queue'

export interface PieceUploadPayload {
  pieceId: string
  pieceFullPath: string
  run: (t: any) => Promise<any>
}

@Injectable()
export class PieceUploadQueue extends BaseQueue<PieceUploadPayload> {
  private readonly logger = new Logger(PieceUploadQueue.name)
  getOptions() {
    return this.config.get<ConfigurationPiece>('piece').uploadQueue
  }

  onError(err: any, payload: PieceUploadPayload, _operation: Operation) {
    this.logger.error(`An error occurred: ${err.message}. [attempt#${err.attemptNumber}] #${payload.pieceId} (${payload.pieceFullPath})`)
    this.logger.error(err)
  }
}
