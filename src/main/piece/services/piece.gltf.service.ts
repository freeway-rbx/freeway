import {join} from 'node:path'

import {ConfigurationPiece} from '@main/_config/configuration'
import {UpsertPieceUploadDto} from '@main/piece/dto/upsert-piece-upload.dto'
import {PieceEventEnum} from '@main/piece/enum'
import {PieceGltfMerger} from '@main/piece/gltf/piece.gltf.merger'
import {PieceGltfParser} from '@main/piece/gltf/piece.gltf.parser'
import {RbxMaterial, RbxMaterialChannel, RbxNode, RbxRoot} from '@main/piece/gltf/types'
import {toArray} from '@main/piece/gltf/utils'
import {PieceProvider} from '@main/piece/piece.provider'
import {
  getRbxImageBitmapBase64,
  hashFromData,
  now,
  STUDIO_LINKS_DIR,
  writeImage,
  writeJson,
  writeString,
} from '@main/utils'
import {Injectable, Logger, NotFoundException, OnModuleInit} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter'
import fse from 'fs-extra'
import {Piece} from '../piece'

@Injectable()
export class PieceGltfService implements OnModuleInit {
  // private readonly logger = new Logger(PieceGltfService.name)
  private readonly options: ConfigurationPiece
  private readonly logger = new Logger(PieceGltfService.name)

  constructor(
    // private readonly provider: PieceProvider,
    private readonly eventEmitter: EventEmitter2,
    private readonly provider: PieceProvider,
    private readonly config: ConfigService,
  ) {
    this.options = this.config.get<ConfigurationPiece>('piece')
  }

  async onModuleInit() {
    await fse.ensureDir(this.options.gltfDirectory)
    try {
      await fse.ensureSymlink(this.options.gltfDirectory, join(STUDIO_LINKS_DIR, 'gltf'), 'junction')
    }
    catch (err: any) {
      this.logger.error('Unable to make gltf directory symlink', err.message)
      await fse.unlink(join(STUDIO_LINKS_DIR, 'gltf'))
      await fse.ensureSymlink(this.options.gltfDirectory, join(STUDIO_LINKS_DIR, 'gltf'), 'junction')
    }
  }

  async getUpdatedDoc(piece: Piece) {
    const parser = new PieceGltfParser(piece)
    const doc = await parser.parse()
    const merger = new PieceGltfMerger()
    merger.merge(piece.metadata || {} as RbxRoot, doc)
    return doc
  }

  async getMesh(piece: Piece, key: string) {
    const metadata = piece.metadata as RbxRoot
    const node = toArray(metadata).find(x => x.id === key) as RbxNode
    if (!node) {
      throw new NotFoundException()
    }

    return node
  }

  async getMeshRaw(piece: Piece, key: string) {
    const node = await this.getMesh(piece, key)

    const meshFileName = this.getMeshFileName(piece, node.id, node.hash)
    // TODO what if file does not exist?

    return fse.readJSON(meshFileName)
  }

  async getMaterial(piece: Piece, materialId: string): Promise<RbxMaterial> {
    const metadata = piece.metadata as RbxRoot
    const materials = metadata?.materials ?? []

    const material = materials.find(x => x.id === materialId) as RbxMaterial

    if (!material) {
      throw new NotFoundException()
    }

    return material
  }

  async getMaterialChannel(piece: Piece, materialId: string, channelName: string) {
    const material = await this.getMaterial(piece, materialId)
    if (!material) {
      throw new NotFoundException()
    }
    const channel = material.channels.find(x => x.name === channelName)

    if (!channel) {
      throw new NotFoundException()
    }

    return channel
  }

  async getMaterialChannelRaw(piece: Piece, materialId: string, channelName: string) {
    const material = await this.getMaterial(piece, materialId)

    if (!material) {
      throw new NotFoundException()
    }

    const channel = await this.getMaterialChannel(piece, materialId, channelName)

    if (!channel) {
      throw new NotFoundException()
    }

    return await getRbxImageBitmapBase64(this.getMaterialChannelFilePath(piece, material.id, channel.name, channel.hash))
  }

  async upsertMaterialChannelUpload(piece: Piece, materialChannel: RbxMaterialChannel, dto: UpsertPieceUploadDto) {
    if (!Array.isArray(materialChannel.uploads)) {
      materialChannel.uploads = []
    }

    const upload = materialChannel.uploads.find(x => x.hash === dto.hash)
    if (upload) {
      upload.assetId = dto.assetId
    }
    else {
      materialChannel.uploads.push({assetId: dto.assetId, hash: dto.hash})
    }

    piece.updatedAt = now()
    this.eventEmitter.emit(PieceEventEnum.updated, piece)

    await this.provider.save()

    return materialChannel
  }

  async upsertMeshUpload(piece: Piece, mesh: RbxNode, dto: UpsertPieceUploadDto) {
    if (!Array.isArray(mesh.uploads)) {
      mesh.uploads = []
    }

    const upload = mesh.uploads.find(x => x.hash === dto.hash)
    if (upload) {
      upload.assetId = dto.assetId
    }
    else {
      mesh.uploads.push({assetId: dto.assetId, hash: dto.hash})
    }

    piece.updatedAt = now()
    this.eventEmitter.emit(PieceEventEnum.updated, piece)

    await this.provider.save()

    return mesh
  }

  async tryGenerate(piece: Piece) {
    try {
      return await this.generate(piece)
    }
    catch (err: any) {
      this.logger.error(err.message)
      throw err
    }
  }

  getMetadataFileName(piece: Piece, docHash: string) {
    const name = `metadata-${docHash}.json`
    return join(this.options.gltfDirectory, piece.id, name)
  }

  getMaterialChannelFilePath(piece: Piece, materialId: string, channelName: string, channelHash: string) {
    const name = `material-${materialId}-${channelName}-${channelHash}.png`
    return join(this.options.gltfDirectory, piece.id, name)
  }

  getMeshFileName(piece: Piece, meshId: string, meshHash: string) {
    const name = `node-${meshId}-${meshHash}.json`
    return join(this.options.gltfDirectory, piece.id, name)
  }

  async generate(piece: Piece) {
    const parser = new PieceGltfParser(piece)
    const metadata = await parser.parse()
    const merger = new PieceGltfMerger()
    const oldMetadata = piece.metadata || {} as RbxRoot
    const hasChanges = merger.merge(oldMetadata, metadata)

    if (hasChanges) {
      const pieceDir = join(this.options.gltfDirectory, piece.id)
      await fse.ensureDir(pieceDir)
      const metadataJson = JSON.stringify(metadata)
      const metadataHash = hashFromData(metadataJson)
      const file = this.getMetadataFileName(piece, metadataHash)
      await writeString(file, metadataJson)

      const materialChanges = merger.getMaterialsChanges()
      if (materialChanges.length > 0) {
        for (const change of materialChanges) {
          const target = change.target as RbxMaterial
          if (target) {
            // add and change
            const rawMaterial = parser.getRawMaterial(target)
            for (const channel of rawMaterial.channels) {
              const file = this.getMaterialChannelFilePath(piece, target.id, channel.name, channel.hash)
              await writeImage(file, channel.image)
            }
          }

          if (change.source && change.target) {
            // change
            // TODO handle change
          }

          if (change.source && !change.target) {
            // delete
            // TODO handle delete
          }
        }
      }

      const nodesChanges = merger.getNodesChanges()
      if (nodesChanges.length > 0) {
        for (const change of nodesChanges) {
          const target = change.target as RbxNode
          const source = change.source as RbxNode
          if (target?.isMesh) {
            // add
            const {mesh} = parser.getRawMesh(target)
            const file = this.getMeshFileName(piece, target.id, target.hash)
            await writeJson(file, mesh)
          }

          if (source && change.target && target?.isMesh) {
            // change
            // TODO handle change
          }

          if (source && !change.target) {
            // delete
            // TODO handle delete
          }
        }
      }
    }

    piece.metadata = metadata
    piece.updatedAt = now()
    await this.provider.save()

    return metadata
  }

  @OnEvent(PieceEventEnum.created)
  async handlePieceCreated(piece: Piece) {
    if (piece.name.endsWith('.glb')) {
      this.logger.log('--------------------------------------------', piece.name)
      await this.tryGenerate(piece)
    }
  }

  @OnEvent(PieceEventEnum.changed)
  async handlePieceChanged(piece: Piece) {
    if (piece.name.endsWith('.glb')) {
      this.logger.log('--------------------------------------------', piece.name)
      await this.tryGenerate(piece)
    }
  }

  @OnEvent(PieceEventEnum.deleted)
  async handlePieceDeleted(_piece: Piece) {
    // TODO handle delete piece
  }
}
