import {ConfigurationPiece} from '@main/_config/configuration'

import {PieceGltfMerger} from '@main/piece/parser/piece.gltf.merger'
import {PieceGltfParser} from '@main/piece/parser/piece.gltf.parser'
import {RbxNode, RbxRoot} from '@main/piece/parser/types'
import {toArray} from '@main/piece/parser/utils'
import {extractRbxMesh} from '@main/utils'
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
    // TODO remove or move
    const parser = new PieceGltfParser(piece)

    const doc = await parser.parse()

    const merger = new PieceGltfMerger()
    merger.merge(piece.metadata || {} as RbxRoot, doc)

    return doc
  }

  async getRbxMesh(piece: Piece, key: string) {
    const parser = new PieceGltfParser(piece)

    const doc = await parser.parse()

    const merger = new PieceGltfMerger()
    merger.merge(piece.metadata || {} as RbxRoot, doc)

    const node = toArray(doc).find(x => x.id === key) as RbxNode
    if (!node) {
      return null // TODO: not found?
    }

    const gltfNode = parser.getGltfNode(node)

    if (!gltfNode.getMesh()) {
      return null // TODO: not found?
    }

    return extractRbxMesh(gltfNode.getMesh())
  }
}
