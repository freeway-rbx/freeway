import {ConfigurationPiece} from '@main/_config/configuration'
import {PieceEventEnum} from '@main/piece/enum'
import {Piece} from '@main/piece/piece'
import {PieceProvider} from '@main/piece/piece.provider'
import {Injectable, Logger} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {OnEvent} from '@nestjs/event-emitter'
import {Interval} from '@nestjs/schedule'
import pMap from 'p-map'

@Injectable()
export class PiecePruneService {
  private readonly logger = new Logger(PiecePruneService.name)
  private readonly options: ConfigurationPiece

  constructor(
    private readonly provider: PieceProvider,
    private readonly config: ConfigService,
  ) {
    this.options = this.config.get<ConfigurationPiece>('piece')
  }

  async prunePieces() {
    const past = (Date.now() - this.options.deletedTimeout) / 1000
    const deletedPieces = this.provider.findMany({deletedAt$null: false, deletedAt$lte: past})

    await pMap(deletedPieces, async (piece: Piece) => {
      await this.provider.hardDelete(piece)
    })

    const dirtyPieces = this.provider.findMany({isDirty: true, deletedAt: null})
    dirtyPieces.forEach((piece: Piece) => {
      this.provider.delete(piece)
    })

    const count = deletedPieces.length + dirtyPieces.length
    if (count) {
      this.logger.log(`Pruned pieces ${count} (deleted ${deletedPieces.length}, dirty: ${dirtyPieces.length})`)
      await this.provider.save()
    }
    else {
      // this.logger.debug(`No pieces to prune`)
    }

    return deletedPieces.length + dirtyPieces.length
  }

  @Interval(60_000) // every 60 seconds
  async handleIntervalPrunePieces() {
    await this.prunePieces()
  }

  @OnEvent(PieceEventEnum.watcherReady)
  async handlePieceWatcherReady() {
    await this.prunePieces()
  }
}
