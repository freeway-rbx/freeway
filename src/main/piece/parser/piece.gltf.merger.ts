import {find} from '@common/where'
import {Node, RbxNode, RbxRoot} from '@main/piece/parser/types'
import {toArray} from '@main/piece/parser/utils'
import {
  now,
} from '@main/utils'
import {Injectable} from '@nestjs/common'
import {Piece} from '../piece'

@Injectable()
export class PieceGltfMerger {
  constructor(
    private readonly piece: Piece,
  ) {}

  async mergeNode(source: RbxNode, target: RbxNode) {
    if (target.isMesh) {
      target.id = source.id

      if (target.hash !== source.hash) {
        target.updatedAt = now()
      }
    }
  }

  async merge(source: RbxRoot, target: RbxRoot) {
    const sourceArr = toArray(source as Node)
    const targetArr = toArray(target as Node)

    const deletedOldNodes = []

    sourceArr.forEach((s) => {
      const t = find(targetArr, {_isVisited: false, name: s.name})

      if (t) {
        this.mergeNode(s, t)
      }
      else {
        deletedOldNodes.push(s)
      }
    })
  }
}
