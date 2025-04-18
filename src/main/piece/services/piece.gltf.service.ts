import {ConfigurationPiece} from '@main/_config/configuration'

import {PieceGltfMerger} from '@main/piece/parser/piece.gltf.merger'
import {PieceGltfParser} from '@main/piece/parser/piece.gltf.parser'
import {Node} from '@main/piece/parser/types'
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
    const merger = new PieceGltfMerger()

    const doc = await parser.parse()

    merger.mergeNodes({} as Node, doc)
    merger.mergeMaterials([], doc.materials)

    return doc
  }
}
