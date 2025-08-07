import {PieceGltfMerger} from '@main/piece/gltf/piece.gltf.merger'
import {PieceGltfParser} from '@main/piece/gltf/piece.gltf.parser'
import {RbxMaterial, RbxMaterialChannel, RbxNode, RbxRoot} from '@main/piece/gltf/types'
import {
  getMaterialChannelFileName,
  getMaterialChannelFullPath,
  getMetadataFullPath,
  getNodeFileName,
  getNodeFullPath,
  getPath,
  toArray,
} from '@main/piece/gltf/utils'
import {hashFromData, writeImage, writeJson, writeString} from '@main/utils'
import {Injectable} from '@nestjs/common'
import fse from 'fs-extra'
import {glob} from 'glob'
import {Piece} from '../piece'

@Injectable()
export class PieceGltfProcessor {
  constructor(
    private readonly piece: Piece,
  ) {

  }

  async process(force = false) {
    const piece = this.piece
    const oldMetadata = piece.metadata || {} as RbxRoot

    const parser = new PieceGltfParser(piece)
    const metadata = await parser.parse()
    const merger = new PieceGltfMerger()

    const hasChanges = merger.merge(oldMetadata, metadata)

    if (hasChanges || force) {
      const pieceDir = getPath(piece)
      await fse.ensureDir(pieceDir)
      const metadataJson = JSON.stringify(metadata)
      const metadataHash = hashFromData(metadataJson)
      const file = getMetadataFullPath(piece, metadataHash)
      await writeString(file, metadataJson)

      const materialChanges = merger.getMaterialsChanges()
      if (materialChanges.length > 0) {
        for (const change of materialChanges) {
          const {target, source} = change
          if (target) {
            // add and change
            const rawMaterial = parser.getRawMaterial(target)
            for (const channel of rawMaterial.channels) {
              const fullPath = getMaterialChannelFullPath(piece, target.id, channel.name, channel.hash)
              await writeImage(fullPath, channel.image)
            }
          }

          if (source && !target) {
            // delete
            // handle?
          }
        }
      }

      const nodesChanges = merger.getNodesChanges()
      if (nodesChanges.length > 0) {
        for (const change of nodesChanges) {
          const source = change.source as RbxNode
          const target = change.target as RbxNode
          if (target?.isMesh) {
            // add and change
            const fullPath = getNodeFullPath(piece, target.id, target.hash)
            await writeRawMeshNode(parser, target, fullPath)
          }

          if (source && !target) {
            // delete
            // handle?
          }
        }
      }
    }

    const files = await this.globExistingFiles()

    // write nodes files (isMesh for now)
    await this.forEachNode(metadata, async (node) => {
      if (!node.isMesh)
        return

      const file = getNodeFileName(node.id, node.hash)

      if (files.includes(file))
        return

      const fullPath = getNodeFullPath(piece, node.id, node.hash)
      await writeRawMeshNode(parser, node, fullPath)
    })

    // write materials channels files
    await this.forEachMaterial(metadata, async (material) => {
      const rawMaterial = parser.getRawMaterial(material)
      for (const channel of rawMaterial.channels) {
        const file = getMaterialChannelFileName(material.id, channel.name, channel.hash)

        if (files.includes(file))
          continue

        const fullPath = getMaterialChannelFullPath(piece, material.id, channel.name, channel.hash)
        await writeImage(fullPath, channel.image)
      }
    })

    return metadata
  }

  async forEachNode(metadata: RbxRoot, fn: (node: RbxNode) => unknown): Promise<void> {
    const nodes = toArray(metadata) as unknown as RbxNode[]
    for (const node of nodes) {
      await fn(node)
    }
  }

  async forEachMaterial(metadata: RbxRoot, fn: (material: RbxMaterial) => unknown): Promise<void> {
    for (const material of metadata.materials) {
      await fn(material)
    }
  }

  async forEachMaterialChannel(metadata: RbxRoot, fn: (material: RbxMaterial, channel: RbxMaterialChannel) => unknown): Promise<void> {
    return this.forEachMaterial(metadata, async (material) => {
      for (const channel of material.channels) {
        await fn(material, channel)
      }
    })
  }

  async globExistingFiles() {
    return glob(
      '*.*',
      {
        cwd: getPath(this.piece),
      },
    )
  }
}

async function writeRawMeshNode(parser: PieceGltfParser, target: RbxNode, file: string) {
  const {mesh} = parser.getRawMesh(target)
  await writeJson(file, mesh)
}
