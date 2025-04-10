import {ElectronService} from '@main/electron/electron.service'
import {PieceEventEnum} from '@main/piece/enum'
import {Piece} from '@main/piece/piece'
import {Injectable} from '@nestjs/common'
import {OnEvent} from '@nestjs/event-emitter'

@Injectable()
export class PieceIpcService {
  constructor(private readonly electron: ElectronService) {}

  _sendIpcMessageEvent(name: string, data: any) {
    const win = this.electron.getMainWindow()
    if (win) {
      win.webContents.send('ipc-message', {name, data})
    }
  }

  @OnEvent(PieceEventEnum.initiated)
  async handlePieceInitiated(piece: Piece) {
    this._sendIpcMessageEvent(PieceEventEnum.initiated, piece)
  }

  @OnEvent(PieceEventEnum.created)
  async handlePieceCreated(piece: Piece) {
    this._sendIpcMessageEvent(PieceEventEnum.created, piece)
  }

  @OnEvent(PieceEventEnum.updated)
  async handlePieceUpdated(piece: Piece) {
    this._sendIpcMessageEvent(PieceEventEnum.updated, piece)
  }

  @OnEvent(PieceEventEnum.changed)
  async handlePieceChanged(piece: Piece) {
    this._sendIpcMessageEvent(PieceEventEnum.changed, piece)
  }

  @OnEvent(PieceEventEnum.uploaded)
  async handlePieceUploaded(piece: Piece) {
    this._sendIpcMessageEvent(PieceEventEnum.uploaded, piece)
  }

  @OnEvent(PieceEventEnum.deleted)
  async handlePieceDeleted(piece: Piece) {
    this._sendIpcMessageEvent(PieceEventEnum.deleted, piece)
  }
}
