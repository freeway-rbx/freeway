import {join} from 'node:path'

import {ConfigurationPiece} from '@main/_config'
import {UpsertPieceUploadDto} from '@main/piece/dto/upsert-piece-upload.dto'
import {PieceEventEnum} from '@main/piece/enum'
import {PieceGltfProcessor} from '@main/piece/gltf/piece.gltf.processor'
import {RbxMaterial, RbxMaterialChannel, RbxNode, RbxRoot} from '@main/piece/gltf/types'
import {getMaterialChannelFullPath, getNodeFullPath, toArray} from '@main/piece/gltf/utils'
import {PieceProvider} from '@main/piece/piece.provider'
import {getRbxImageBitmapBase64, now, STUDIO_LINKS_DIR} from '@main/utils'
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
    const dir = join(STUDIO_LINKS_DIR, 'gltf')

    await fse.ensureDir(this.options.gltfDirectory)
    try {
      await fse.ensureSymlink(this.options.gltfDirectory, dir, 'junction')
    }
    catch (err: any) {
      this.logger.error('Unable to make gltf directory symlink', err.message)
      await fse.unlink(dir)
      await fse.ensureSymlink(this.options.gltfDirectory, dir, 'junction')
    }
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

    const fullPath = getNodeFullPath(piece, node.id, node.hash)
    await this.ensureFileExists(piece, fullPath)

    return fse.readJSON(fullPath)
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

    const fullPath = getMaterialChannelFullPath(piece, material.id, channel.name, channel.hash)
    await this.ensureFileExists(piece, fullPath)

    return await getRbxImageBitmapBase64(fullPath)
  }

  async ensureFileExists(piece: Piece, fullPath: string): Promise<void> {
    const exists = await fse.pathExists(fullPath)
    if (!exists) {
      await this.tryProcess(piece)
    }
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

  async process(piece: Piece) {
    const processor = new PieceGltfProcessor(piece)
    piece.metadata = await processor.process()
    piece.updatedAt = now()
    await this.provider.save()
  }

  async tryProcess(piece: Piece) {
    try {
      return await this.process(piece)
    }
    catch (err: any) {
      this.logger.error(err.message)
      throw err
    }
  }

  @OnEvent(PieceEventEnum.created)
  async handlePieceCreated(piece: Piece) {
    if (piece.name.endsWith('.glb')) {
      this.logger.log('--------------------------------------------', piece.name)
      await this.tryProcess(piece)
    }
  }

  @OnEvent(PieceEventEnum.changed)
  async handlePieceChanged(piece: Piece) {
    if (piece.name.endsWith('.glb')) {
      this.logger.log('--------------------------------------------', piece.name)
      await this.tryProcess(piece)
    }
  }

  @OnEvent(PieceEventEnum.deleted)
  async handlePieceDeleted(_piece: Piece) {
    // TODO handle delete piece
  }
}
