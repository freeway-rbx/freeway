import {PieceEventEnum} from '@main/piece/enum'
import {PieceProvider} from '@main/piece/piece.provider'
import {now} from '@main/utils'
import {Injectable} from '@nestjs/common'
import {EventEmitter2} from '@nestjs/event-emitter'
import {pEvent, TimeoutError} from 'p-event'

@Injectable()
export class PieceNotificationService {
  constructor(
    private readonly provider: PieceProvider,
    private readonly eventEmitter: EventEmitter2,
  ) {
    //
  }

  async notify() {
    const ts = now()
    try {
      await pEvent(this.eventEmitter, [
        PieceEventEnum.created,
        PieceEventEnum.changed,
        PieceEventEnum.deleted,
        PieceEventEnum.uploaded,
      ], {timeout: 120_000})
    }
    catch (error) {
      if (!(error instanceof TimeoutError)) {
        throw error
      }
    }

    const criteria = {$or: [{createdAt$gte: ts}, {updatedAt$gte: ts}, {deletedAt$gte: ts}]}
    return this.provider.findMany(criteria)
  }
}
