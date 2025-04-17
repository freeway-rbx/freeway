import {Node} from '@main/piece/parser/types'

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
