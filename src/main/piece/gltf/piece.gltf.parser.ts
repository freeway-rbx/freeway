import {Buffer} from 'node:buffer'
import * as GLTF from '@gltf-transform/core'
import {Mesh} from '@gltf-transform/core'
import {dedup, getMeshVertexCount, simplify, VertexCountMethod, weld} from '@gltf-transform/functions'
import {MATERIAL_MAP_DEFINITIONS} from '@main/piece/gltf/constants'
import {
  RbxMaterial,
  RbxMaterialChannelRaw,
  RbxNode,
  RbxRoot,
  RbxScene,
} from '@main/piece/gltf/types'
import {
  extractRbxMesh2,
  hashFromData,
} from '@main/utils'

import {Injectable} from '@nestjs/common'
import {MeshoptSimplifier} from 'meshoptimizer'
import pMap from 'p-map'
import sharp from 'sharp'
import {Piece} from '../piece'

const concurrency = 2

@Injectable()
export class PieceGltfParser {
  private meshMap: Map<RbxNode, {gltfNode: GLTF.Node, mesh: any}> = new Map()
  private materialMap: Map<RbxMaterial, {gltfMaterial: GLTF.Material, channels: RbxMaterialChannelRaw[]}> = new Map()

  constructor(
    private readonly piece: Piece,
  ) {}

  async createMaterialChannels(material: GLTF.Material): Promise<RbxMaterialChannelRaw[]> {
    const channels: RbxMaterialChannelRaw[] = []

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
          image,
        })
      }, {concurrency})
    })

    return channels
  }

  async createMaterial(gltfMaterial: GLTF.Material): Promise<RbxMaterial> {
    const channels = await this.createMaterialChannels(gltfMaterial)

    const material = {
      name: gltfMaterial.getName(),
      channels: channels.map((channel) => {
        return {
          name: channel.name,
          hash: channel.hash,
        }
      }),
    }

    this.materialMap.set(material, {gltfMaterial, channels})

    return material
  }

  async createMaterials(root: GLTF.Root): Promise<RbxMaterial[]> {
    return pMap<GLTF.Material, RbxMaterial>(root.listMaterials(), async (material): Promise<RbxMaterial> => {
      return this.createMaterial(material)
    }, {concurrency})
  }

  async createScenes(root: GLTF.Root): Promise<RbxScene[]> {
    return await pMap<GLTF.Scene, RbxScene>(root.listScenes(), async (scene, index): Promise<RbxScene> => {
      return this.createScene(scene, `scene-${index}`)
    }, {concurrency})
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
      node.isMesh = true
      node.meshName = gltfMesh.getName()

      const materials = this.extractMaterialsNames(gltfMesh)
      if (materials?.length) {
        node.materials = materials
      }

      const mesh = extractRbxMesh2(gltfNode.getMesh(), gltfNode.getWorldMatrix())
      node.hash = hashFromData(JSON.stringify(mesh))
      this.meshMap.set(node, {gltfNode, mesh})
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

  private extractMaterialsNames(mesh: Mesh) {
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

    // io.registerExtensions([EXTMeshoptCompression])
    //   .registerDependencies({'meshopt.decoder': MeshoptDecoder})

    await this.simplify2(document)

    // await io.write(`${this.piece.fullPath}-output.glb`, document)

    return this.createRoot(document.getRoot())
  }

  private async simplify2(document: GLTF.Document) {
    // Apply the simplify function with a specific ratio.
    const targetVertexCount = 10000
    const originalVertexCount = document.getRoot().listMeshes().reduce((sum, mesh) => {
      return sum + mesh.listPrimitives().reduce((primitiveSum, primitive) => {
        const positionAttribute = primitive.getAttribute('POSITION')
        return primitiveSum + (positionAttribute ? positionAttribute.getCount() : 0)
      }, 0)
    }, 0)

    const ratio = targetVertexCount / originalVertexCount
    console.log(`------------------------------------------------------------- Transform gltf simplify ratio ${ratio}`)

    await document.transform(
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: 0,
        error: 1,
        lockBorder: false,
        cleanup: true,
      }),
      dedup({
        keepUniqueNames: true,
      }),
    )
  }

  private async simplify(document: GLTF.Document) {
    let maxCount = 0
    for (const mesh of document.getRoot().listMeshes()) {
      maxCount = Math.max(maxCount, getMeshVertexCount(mesh, VertexCountMethod.RENDER)) // VertexCountMethod.UPLOAD?
    }

    console.log(`------------------------------------------------------------- MAX VERTEX COUNT ${maxCount}`)
    if (maxCount > 10_000) {
      const ratio = 10_000 / maxCount
      console.log(`------------------------------------------------------------- Transform gltf simplify ratio ${ratio}`)
      await document.transform(
        weld({
          // overwrite: true,
        }),
        simplify({
          simplifier: MeshoptSimplifier,
          ratio,
          error: 1,
          // cleanup: true,
          // lockBorder: true,
        }),
      )
    }

    return document
  }

  getRawMaterial(obj: RbxMaterial) {
    return this.materialMap.get(obj)
  }

  getRawMesh(obj: RbxNode) {
    return this.meshMap.get(obj)
  }
}
