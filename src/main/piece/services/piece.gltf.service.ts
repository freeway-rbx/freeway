import {ConfigurationPiece} from '@main/_config/configuration'

import {PieceGltfParser} from '@main/piece/parser/piece.gltf.parser'
import {Injectable, OnModuleInit} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {ensureDir} from 'fs-extra'
import {Piece} from '../piece'

@Injectable()
export class PieceGltfService implements OnModuleInit {
  // private readonly logger = new Logger(PieceGltfService.name)
  private readonly options: ConfigurationPiece

  constructor(
    // private readonly provider: PieceProvider,
    // private readonly eventEmitter: EventEmitter2,
    private readonly config: ConfigService,
  ) {
    this.options = this.config.get<ConfigurationPiece>('piece')
  }

  async onModuleInit() {
    await ensureDir(this.options.gltfDirectory)
  }

  async getPieceMetadata(piece: Piece) {
    const parser = new PieceGltfParser(piece)
    return parser.parse()
  }
}
