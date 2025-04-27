import {find} from '@common/where'
import {Node, RbxMaterial, RbxMaterialChannel, RbxNode, RbxRoot} from '@main/piece/gltf/types'
import {toArray} from '@main/piece/gltf/utils'
import {now} from '@main/utils'

interface Change<T, K = unknown> {
  source?: T
  target?: T
  changes?: Change<K>[]
}

export class PieceGltfMerger {
  private sourceNodes: Node[]
  private targetNodes: Node[]
  private nodesChanges: Change<Node>[]

  private sourceMaterials: RbxMaterial[]
  private targetMaterials: RbxMaterial[]
  private materialsChanges: Change<RbxMaterial>[]

  mergeNode(source: RbxNode, target: RbxNode) {
    if (target.isMesh) {
      target.id = source.id

      if (target.hash !== source.hash) {
        target.updatedAt = now()
        return true
      }
    }

    return false
  }

  mergeNodes(sourceNode: Node, targetNode: Node) {
    const changes: Change<Node>[] = []
    this.sourceNodes = toArray(sourceNode)
    this.targetNodes = toArray(targetNode)

    const deletedSourceNodes = []

    this.sourceNodes.forEach((source) => {
      const target = find(this.targetNodes, {name: source.name})

      if (target) {
        const hasChanges = this.mergeNode(source, target)
        if (hasChanges) {
          changes.push({source, target})
        }
      }
      else {
        deletedSourceNodes.push(source)
        changes.push({source, target: null})
      }
    })

    this.targetNodes.forEach((target: RbxNode) => {
      if (target.isMesh && !target.id) {
        target.id = this._generateUniqId(this.targetNodes, 3)
        changes.push({source: null, target})
      }
    })

    return changes
  }

  mergeMaterial(sourceMaterial: RbxMaterial, targetMaterial: RbxMaterial) {
    const changes: Change<RbxMaterialChannel>[] = []

    targetMaterial.id = sourceMaterial.id

    sourceMaterial.channels.forEach((source) => {
      const target = targetMaterial.channels.find(x => source.name === x.name)

      if (!target) {
        changes.push({source, target: null})
        return
      }

      if (target.hash !== source.hash) {
        target.updatedAt = now()
        changes.push({source, target})
      }
    })

    targetMaterial.channels.forEach((target) => {
      const source = sourceMaterial.channels.find(x => target.name === x.name)
      if (!source) {
        changes.push({source: null, target})
      }
    })

    return changes
  }

  mergeMaterials(sourceMaterials: RbxMaterial[], targetMaterials: RbxMaterial[]) {
    this.sourceMaterials = sourceMaterials || []
    this.targetMaterials = targetMaterials || []
    const changes: Change<RbxMaterial, RbxMaterialChannel>[] = []

    this.sourceMaterials.forEach((source) => {
      const target = find(this.targetMaterials, {name: source.name})

      if (!target) {
        changes.push({source, target: null})
        return
      }

      const materialChannelChanges = this.mergeMaterial(source, target)
      if (materialChannelChanges.length) {
        changes.push({source, target, changes: materialChannelChanges})
      }
    })

    this.targetMaterials.forEach((target) => {
      if (!target.id) {
        target.id = this._generateUniqId(this.targetMaterials, 2)
        changes.push({source: null, target})
      }
    })

    return changes
  }

  private _generateUniqId(arr: any[], length: number = 3) {
    const max = arr.reduce((acc, val) => {
      const id = val.id || 0
      return acc > id ? acc : id
    }, 0)

    return (Number.parseInt(max, 36) + 1).toString(36).padStart(length, '0')
    // for (let i = 0; /* to the moon */; i++) {
    //   const id = randomString(Math.floor(i / 10 + length))
    //
    //   if (!whereFind<RbxNode>(arr, {id})) {
    //     return id
    //   }
    // }
  }

  merge(sourceNode: RbxRoot, targetNode: RbxRoot) {
    this.nodesChanges = this.mergeNodes(sourceNode, targetNode)
    this.materialsChanges = this.mergeMaterials(sourceNode.materials, targetNode.materials)

    return this.nodesChanges.length > 0 || this.materialsChanges.length > 0
  }

  getMaterialsChanges() {
    return this.materialsChanges
  }

  getNodesChanges() {
    return this.nodesChanges
  }
}
