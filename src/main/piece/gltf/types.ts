import * as GLTF from '@gltf-transform/core'
import sharp from 'sharp'

export interface Upload {
  hash: string
  assetId: string
}

export interface Node {
  id?: string
  name: string
  children?: RbxScene[]
}

export interface RbxRoot extends Node {
  materials?: RbxMaterial[]
}

export interface RbxScene extends Node {
}

export interface RbxMaterial {
  id?: string
  name: string
  channels: RbxMaterialChannel[]
}

export interface RbxNode extends Node {
  id?: string
  materials?: string[] // material names, not ids
  hash?: string
  updatedAt?: number
  _mesh?: GLTF.Mesh
  isMesh?: boolean
  meshName?: string
  uploads?: Upload[]
}

export interface RbxMaterialChannel {
  name: string
  hash: string
  updatedAt?: number
  uploads?: Upload[]
}

export interface RbxMaterialChannelRaw extends RbxMaterialChannel {
  image?: sharp.Sharp
}
