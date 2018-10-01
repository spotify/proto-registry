import { ReflectionObject, Root } from 'protobufjs'
import { FileDescriptorSet, IFileDescriptorSet } from 'protobufjs/ext/descriptor'
import { buildRoot } from './parser'

export class SchemaLoader {
  private url: string

  constructor (url: string) {
    this.url = url
  }

  public load (): Promise<Schema> {
    return fetch(this.url)
      .then((response) => response.arrayBuffer())
      .then((buffer) => new Uint8Array(buffer))
      .then((bytes) => FileDescriptorSet.decode(bytes) as any as IFileDescriptorSet)
      .then((descriptor) => buildRoot(descriptor))
      .then((root) => new Schema(root))
  }
}

export class Schema {
  public readonly root: Root
  public readonly all: ReflectionObject[]

  constructor (root: Root) {
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
