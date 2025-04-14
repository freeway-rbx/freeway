import {PieceEventEnum, PieceStatusEnum} from '@main/piece/enum'
import {PieceUploadQueue} from '@main/piece/queue'
import {RobloxApiService} from '@main/roblox-api/roblox-api.service'
import {now} from '@main/utils'

import {Injectable, Logger} from '@nestjs/common'
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter'
import {Piece, PieceUpload} from '../piece'

@Injectable()
export class PieceUploadService {
  private readonly logger = new Logger(PieceUploadService.name)

  constructor(
    private readonly robloxApiService: RobloxApiService,
    private readonly queue: PieceUploadQueue,
    private readonly eventEmitter: EventEmitter2,
  ) {
    //
  }

  async queueUploadAsset(piece: Piece) {
    const upload = this._findCurrentUpload(piece)
    if (upload) {
      return
    }

    this._changePieceStatus(piece, PieceStatusEnum.queue)

    this.queue.push<PieceUpload>(piece.fullPath, {
      pieceId: piece.id,
      pieceFullPath: piece.fullPath,
      run: async () => {
        this._changePieceStatus(piece, PieceStatusEnum.upload)
        return await this._uploadPiece(piece)
      },
    })
      .then((upload) => {
        piece.uploads.push(upload)
        piece.uploadedAt = now()

        this._changePieceStatus(piece, PieceStatusEnum.ok)
        this.eventEmitter.emit(PieceEventEnum.uploaded, piece)
      })
      .catch((err) => {
        this._changePieceStatus(piece, PieceStatusEnum.error)

        this.logger.error(`Unable to upload piece #${piece.id} (file: ${piece.fullPath})`)
        this.logger.error(err)
      })
  }

  async uploadAsset(piece: Piece) {
    let upload = this._findCurrentUpload(piece)
    if (upload) {
      return piece
    }

    try {
      this._changePieceStatus(piece, PieceStatusEnum.upload)

      upload = await this._uploadPiece(piece)

      piece.uploads.push(upload)
      piece.uploadedAt = now()

      this._changePieceStatus(piece, PieceStatusEnum.ok)
      this.eventEmitter.emit(PieceEventEnum.uploaded, piece)
    }
    catch (err) {
      this._changePieceStatus(piece, PieceStatusEnum.error)

      this.logger.error(`Unable to upload piece #${piece.id} (file: ${piece.fullPath})`)
      this.logger.error(err)

      throw err
    }

    return piece
  }

  private _findCurrentUpload(piece: Piece) {
    return piece.uploads.find(x => x.hash === piece.hash)
  }

  private _changePieceStatus(piece: Piece, status: PieceStatusEnum) {
    piece.status = status
    this.eventEmitter.emit(PieceEventEnum.updated, piece)
  }

  private async _uploadPiece(piece: Piece): Promise<PieceUpload> {
    // TODO: make upload incremental - step by step, saving results on each
    const result = await this.robloxApiService.createAsset(
      piece.fullPath,
      'decal',
      `Piece #${piece.id}`,
      `hash:${piece.hash}`,
    )

    return PieceUpload.fromObject({
      hash: piece.hash,
      assetId: result.assetId,
      decalId: result.decalId,
      operationId: result.operationId,
    })
  }

  private async _autoUploadAsset(piece: Piece) {
    if (piece.isAutoUpload) {
      await this.queueUploadAsset(piece)
    }
  }

  @OnEvent(PieceEventEnum.initiated)
  async handlePieceInitiated(piece: Piece) {
    await this._autoUploadAsset(piece)
  }

  @OnEvent(PieceEventEnum.created)
  async handlePieceCreated(piece: Piece) {
    await this._autoUploadAsset(piece)
  }

  @OnEvent(PieceEventEnum.changed)
  async handlePieceChanged(piece: Piece) {
    await this._autoUploadAsset(piece)
  }
}
