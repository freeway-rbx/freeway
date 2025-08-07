import {join} from 'node:path'
import {config} from '@main/_config'

import {Piece} from '@main/piece/piece'
import {Node} from './types'

export function traverse(node: Node, fn: (node: Node) => void) {
  fn(node)

  if (!node.children)
    return

  for (const child of node.children) {
    traverse(child, fn)
  }
}

export function toArray(node: Node): Node[] {
  const result = []

  traverse(node, (node: Node) => {
    result.push(node)
  })

  return result
}

export function getMetadataName(docHash: string) {
  return `metadata-${docHash}.json`
}

export function getPath(piece: Piece, name = null) {
  if (!name) {
    // return gltf dir for piece
    return join(config.piece.gltfDirectory, piece.id)
  }
  return join(config.piece.gltfDirectory, piece.id, name)
}

export function getMetadataFullPath(piece: Piece, docHash: string) {
  const name = getMetadataName(docHash)
  return join(getPath(piece, name))
}

export function getMaterialChannelFileName(materialId: string, channelName: string, channelHash: string) {
  return `material-${materialId}-${channelName}-${channelHash}.png`
}

export function getMaterialChannelFullPath(piece: Piece, materialId: string, channelName: string, channelHash: string) {
  const name = getMaterialChannelFileName(materialId, channelName, channelHash)
  return getPath(piece, name)
}

export function getNodeFileName(meshId: string, meshHash: string) {
  return `node-${meshId}-${meshHash}.json`
}

export function getNodeFullPath(piece: Piece, meshId: string, meshHash: string) {
  const name = getNodeFileName(meshId, meshHash)
  return getPath(piece, name)
}
