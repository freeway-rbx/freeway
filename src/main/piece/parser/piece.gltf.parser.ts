import {Buffer} from 'node:buffer'
import * as GLTF from '@gltf-transform/core'
import {Mesh} from '@gltf-transform/core'
import {MATERIAL_MAP_DEFINITIONS} from '@main/piece/parser/constants'
import {RbxMaterial, RbxMaterialChannel, RbxNode, RbxRoot, RbxScene} from '@main/piece/parser/types'
import {
  extractRbxMesh,
  hashFromData,
} from '@main/utils'
import {Injectable} from '@nestjs/common'
import pMap from 'p-map'
import sharp from 'sharp'
import {Piece} from '../piece'

@Injectable()
export class PieceGltfParser {
  constructor(
    private readonly piece: Piece,
  ) {}

  async extractMaterialChannels(material: GLTF.Material): Promise<RbxMaterialChannel[]> {
    const channels: RbxMaterialChannel[] = []

    await pMap(MATERIAL_MAP_DEFINITIONS, async (def) => {
      const texture = material[def.method]()
      if (!texture)
        return

      const textureImage = texture.getImage()
      if (!textureImage)
        return

      await pMap(def.channels, async (channel) => {
        const image = sharp(Buffer.from(textureImage))
        if (channel.extractChannel) {
          image.extractChannel(channel.extractChannel as any)
        }

        const hash = hashFromData(await image.toBuffer())

        channels.push({
          hash,
          name: channel.name,
          // image,
        })
      }, {concurrency: 1})
    })

    return channels
  }

  async createMaterial(material: GLTF.Material): Promise<RbxMaterial> {
    const name = material.getName()
    return {
      id: hashFromData(name), // TODO: generate id, not md5
      name: material.getName(),
      channels: await this.extractMaterialChannels(material),
    }
  }

  async createMaterials(root: GLTF.Root): Promise<RbxMaterial[]> {
    return pMap<GLTF.Material, RbxMaterial>(root.listMaterials(), async (material): Promise<RbxMaterial> => {
      return this.createMaterial(material)
    }, {concurrency: 1})
  }

  async createScenes(root: GLTF.Root): Promise<RbxScene[]> {
    return await pMap<GLTF.Scene, RbxScene>(root.listScenes(), async (scene, index): Promise<RbxScene> => {
      return this.createScene(scene, `scene-${index}`)
    }, {concurrency: 1})
  }

  async createRoot(root: GLTF.Root): Promise<RbxRoot> {
    const materials = await this.createMaterials(root)
    const children = await this.createScenes(root)

    return {
      name: root.getName() || 'root',
      children,
      materials,
    } as RbxRoot
  }

  createScene(gltfScene: GLTF.Scene, defaultName: number | string = 'scene'): RbxScene {
    const scene = {
      name: gltfScene.getName() || defaultName,
      children: [],
    } as RbxScene

    this.createChildren(gltfScene, scene)

    return scene
  }

  createNode(gltfNode: GLTF.Node, defaultName: number | string = 'node'): any {
    const node = {
      name: gltfNode.getName() || `${defaultName}`,
      isMesh: false,
    } as RbxNode

    const gltfMesh = gltfNode.getMesh()

    if (gltfMesh) {
      node.id = hashFromData(node.name) // TODO generate id
      node.isMesh = true
      node.meshName = gltfMesh.getName()

      const materials = this.extractMaterials(gltfMesh)
      if (materials?.length) {
        node.materials = materials
      }

      node._mesh = gltfMesh
      // node._mesh = this.extractMesh(gltfNode)
    }
    else {
      node.isMesh = false
    }

    return node
  }

  createChildren(gltfNode: GLTF.Node | GLTF.Scene, node: RbxNode | RbxScene) {
    const children = gltfNode.listChildren()

    if (children?.length) {
      node.children = []
    }

    children.forEach((child, index) => {
      const myChild = this.createNode(child, index)
      node.children.push(myChild)
      this.createChildren(child, myChild)
    })
  }

  private extractMesh(gNode: GLTF.Node) {
    return extractRbxMesh(gNode.getMesh())
  }

  private extractMaterials(mesh: Mesh) {
    const result = []
    mesh.listPrimitives().forEach((primitive) => {
      const material = primitive.getMaterial()
      if (!material) {
        return
      }
      result.push(material.getName())
    })

    return result
  }

  async parse() {
    const io = new GLTF.NodeIO()
    const document = await io.read(this.piece.fullPath)

    return this.createRoot(document.getRoot())
  }
}
