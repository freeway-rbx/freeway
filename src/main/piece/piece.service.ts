import {Buffer} from 'node:buffer'
import {join, parse} from 'node:path'
import process from 'node:process'
import * as GLTF from '@gltf-transform/core'
import {ConfigurationPiece} from '@main/_config/configuration'
import {CreatePieceDto, UpdatePieceDto} from '@main/piece/dto'
import {UpsertPieceUploadDto} from '@main/piece/dto/upsert-piece-upload.dto'
import {PieceEventEnum, PieceRoleEnum, PieceTypeEnum} from '@main/piece/enum'
import {PieceProvider} from '@main/piece/piece.provider'
import {
  getMime,
  getRbxFileBase64,
  getRbxImageBitmapBase64,
  getRbxMeshBase64,
  hashFromData,
  now,
  RbxBase64File,
  RbxBase64Image,
  writeRbxFile,
  writeRbxImage,
} from '@main/utils'
import {Injectable, Logger, NotFoundException, UnprocessableEntityException} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {EventEmitter2} from '@nestjs/event-emitter'
import {app} from 'electron'
import fse from 'fs-extra'
import pMap from 'p-map'
import sharp from 'sharp'
import {temporaryFile} from 'tempy'
import {Piece} from './piece'

@Injectable()
export class PieceService {
  private readonly logger = new Logger(PieceService.name)
  private readonly options: ConfigurationPiece

  constructor(
    private readonly provider: PieceProvider,
    private readonly eventEmitter: EventEmitter2,
    private readonly config: ConfigService,
  ) {
    this.options = this.config.get<ConfigurationPiece>('piece')
  }

  findMany(criteria: any): Piece[] {
    return this.provider.findMany({...criteria, ...{deletedAt: null, isDirty: false}})
  }

  getPieceById(id: string): Piece {
    const piece = this.provider.findOne({id})

    if (!piece) {
      throw new NotFoundException()
    }

    return piece
  }

  public async getRaw(id: string) {
    const piece = this.getPieceById(id)

    if (piece.type === PieceTypeEnum.image) {
      return await getRbxImageBitmapBase64(piece.fullPath)
    }

    if (piece.type === PieceTypeEnum.mesh) {
      return await getRbxMeshBase64(piece.fullPath)
    }

    return await getRbxFileBase64(piece.fullPath)
  }

  async create(dto: CreatePieceDto) {
    const name = dto.name
    const dir = this.options.watchDirectory
    let piece: Piece

    if (dto.base64) {
      piece = await this.provider.create(dir, name, PieceRoleEnum.virtual)
      try {
        await this.createPieceFileBase64(piece, dto)
        piece.role = PieceRoleEnum.asset
      }
      catch (err: any) {
        this.logger.error('Unable to write piece file', err)
        this.provider.hardDelete(piece) // revert back, delete created piece
        throw new UnprocessableEntityException(`Unable to write piece file (${err.message})`)
      }
    }
    else {
      piece = await this.provider.createPlaceholder({dir, name, role: PieceRoleEnum.asset})
    }

    this.eventEmitter.emit(PieceEventEnum.created, piece)

    return piece
  }

  async createPieceFileBase64(piece: Piece, dto: RbxBase64Image | RbxBase64File) {
    if (piece.type === PieceTypeEnum.image) {
      const parsed = parse(piece.name)
      const file = temporaryFile({name: parsed.base})
      await writeRbxImage(dto as RbxBase64Image, file)
      await fse.move(file, join(piece.dir, piece.name)) // move from temp file to actual file
    }
    else if (piece.type === PieceTypeEnum.mesh) {
      const parsed = parse(piece.name)
      const file = temporaryFile({name: parsed.base})
      await writeRbxFile(dto, file)
      await fse.move(file, join(piece.dir, piece.name)) // move from temp file to actual file
    }
    else {
      throw new UnprocessableEntityException(`Create piece file is not supported for given type ${piece.type}`)
    }
  }

  async update(piece: Piece, dto: UpdatePieceDto) {
    if (dto.base64) {
      try {
        await this.updatePieceFileBase64(piece, dto)
        piece.role = PieceRoleEnum.asset
      }
      catch (err: any) {
        this.logger.error('Unable to write piece file', err)
        throw new UnprocessableEntityException(`Unable to write piece file (${err.message})`)
      }
    }

    if (dto.isAutoUpload !== undefined) {
      const isAutoUploadOld = piece.isAutoUpload
      piece.isAutoUpload = dto.isAutoUpload
      if (piece.isAutoUpload && piece.isAutoUpload !== isAutoUploadOld) {
        this.eventEmitter.emit(PieceEventEnum.enabledAutoUpload, piece)
      }
    }

    this.eventEmitter.emit(PieceEventEnum.updated, piece)
    await this.provider.save()
    return piece
  }

  async updatePieceFileBase64(piece: Piece, dto: RbxBase64Image | RbxBase64File) {
    const destFile = join(piece.dir, piece.name)
    if (piece.type === PieceTypeEnum.image) {
      await writeRbxImage(dto as RbxBase64Image, destFile)
    }
    else if (piece.type === PieceTypeEnum.mesh) {
      await writeRbxFile(dto, destFile)
    }
    else {
      throw new UnprocessableEntityException(`Update piece file is not supported for given type ${piece.type}`)
    }
  }

  async upsertUpload(piece: Piece, dto: UpsertPieceUploadDto) {
    const upload = piece.uploads.find(x => x.hash === dto.hash)
    if (upload) {
      upload.assetId = dto.assetId
    }
    else {
      piece.uploads.push({assetId: dto.assetId, hash: dto.hash})
    }
    piece.updatedAt = now()
    this.eventEmitter.emit(PieceEventEnum.updated, piece)

    await this.provider.save()

    return piece
  }

  async delete(piece: Piece) {
    const result = await this.provider.hardDeleteWithFile(piece)
    this.eventEmitter.emit(PieceEventEnum.deleted, piece)
    await this.provider.save()
    return result
  }

  getPiecePreviewPath(piece: Piece) {
    if (piece.type !== PieceTypeEnum.image) {
      const isDev = !app.isPackaged
      const staticDir = isDev
        ? join(__dirname, '../../static')
        : join(process.resourcesPath, 'static')

      return join(staticDir, 'preview-placeholder.png')
    }

    return piece.fullPath
  }

  getPieceMime(piece: Piece) {
    return getMime(piece.fullPath)
  }

  async extractMaterialMap(material: GLTF.Material) {
    const defs = [
      {
        method: 'getBaseColorTexture',
        channels: [
          {name: 'basecolor', extractChannel: null},
        ],
      },
      {
        method: 'getNormalTexture',
        channels: [
          {name: 'normal', extractChannel: null},
        ],
      },
      {
        method: 'getMetallicRoughnessTexture',
        channels: [
          {name: 'roughness', extractChannel: 1},
          {name: 'metalness', extractChannel: 2},
        ],
      },
    ]

    interface RbxMaterialChannel {
      name: string
      sharpImage: sharp.Sharp
      hash?: string
    }

    const channels: RbxMaterialChannel[] = []

    await pMap(defs, async (def) => {
      const texture = material[def.method]()
      if (!texture)
        return

      const image = texture.getImage()
      if (!image)
        return

      await pMap(def.channels, async (channel) => {
        const sharpImage = sharp(Buffer.from(image))
        if (channel.extractChannel) {
          sharpImage.extractChannel(channel.extractChannel as any)
        }
        channels.push({
          name: channel.name,
          sharpImage,
        })
      })
    })

    await pMap(channels, async (channel) => {
      channel.hash = hashFromData(await channel.sharpImage.toBuffer())
    })

    return channels.map((c) => {
      return {
        id: hashFromData(c.name),
        name: c.name,
        hash: c.hash,
      }
    })
  }

  async createFromGltfMaterial(material: GLTF.Material) {
    const name = material.getName()
    return {
      id: hashFromData(name), // TODO: generate id, not md5
      name: material.getName(),
      channels: await this.extractMaterialMap(material),
    }
  }

  createFromGltfNode(node: GLTF.Node | GLTF.Scene, defaultName: number | string): any {
    const name = node.getName()
    const myNode = {
      name: name || `${defaultName}`,
      isMesh: false,
      materials: [],
    } as any

    if (node instanceof GLTF.Node) {
      const mesh = node.getMesh()

      if (mesh) {
        myNode.isMesh = true
        mesh.listPrimitives().forEach((primitive) => {
          const material = primitive.getMaterial()
          if (!material) {
            return
          }
          myNode.materials.push(material.getName())
        })
      }
      else {
        myNode.isMesh = false
      }
    }

    return myNode
  }

  traverse(node: GLTF.Node | GLTF.Scene, myNode: any) {
    const children = node.listChildren()

    children.forEach((child, index) => {
      const myChild = this.createFromGltfNode(child, index)
      this.traverse(child, myChild)

      if (!myNode.children) {
        myNode.children = []
      }

      myNode.children.push(myChild)
    })
  }

  async getPieceMetadata(piece: Piece) {
    const io = new GLTF.NodeIO()
    const document = await io.read(piece.fullPath)
    const root = document.getRoot()

    return pMap(root.listScenes(), async (scene) => {
      const myScene = this.createFromGltfNode(scene, 'scene-0')
      this.traverse(scene, myScene)
      const materials = root.listMaterials()
      myScene.materials = await pMap(materials, async (material) => {
        return this.createFromGltfMaterial(material)
      }, {concurrency: 1})
      return myScene
    })
  }
}
