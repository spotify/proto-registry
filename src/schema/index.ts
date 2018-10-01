import { ReflectionObject, Root } from 'protobufjs'
import { FileDescriptorSet, IFileDescriptorSet } from 'protobufjs/ext/descriptor'
import { buildRoot } from './parser'
import buffer from './schema.pb'

// TODO(dflemstr): Instead of having the schema as a global variable, load it dynamically.
const bytes = new Uint8Array(buffer)
const descriptor: IFileDescriptorSet = FileDescriptorSet.decode(bytes) as any as IFileDescriptorSet
const root: Root = buildRoot(descriptor)
root.resolveAll()

export const all: ReflectionObject[] = []

const buildAll = (node: ReflectionObject): void => {
  if (node !== root) {
    all.push(node)
  }

  if ('nestedArray' in node) {
    const typedNode = node as {nestedArray: ReflectionObject[]}
    for (const child of typedNode.nestedArray) {
      buildAll(child)
    }
  }
}
buildAll(root)

export default root
