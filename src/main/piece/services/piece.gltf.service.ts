import {Buffer} from 'node:buffer'
import * as GLTF from '@gltf-transform/core'
import {ConfigurationPiece} from '@main/_config/configuration'
import {
  hashFromData,
} from '@main/utils'
import {Injectable, OnModuleInit} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {ensureDir} from 'fs-extra'
import pMap from 'p-map'
import sharp from 'sharp'
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
