import { ReflectionObject, Root } from 'protobufjs'

export class Schema {
  public readonly root: Root
  public readonly all: ReflectionObject[]

  constructor (root: Root) {
    root.resolveAll()
    const allBuilder: ReflectionObject[] = []
    buildAll(root, root, allBuilder)

    this.root = root
    this.all = allBuilder
  }
}

const buildAll = (r: Root, node: ReflectionObject, output: ReflectionObject[]): void => {
  if (node !== r) {
    output.push(node)
  }

  if ('nestedArray' in node) {
    const typedNode = node as { nestedArray: ReflectionObject[] }
    for (const child of typedNode.nestedArray) {
      buildAll(r, child, output)
    }
  }
}
