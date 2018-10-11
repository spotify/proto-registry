import { INamespace } from 'protobufjs'
import { FileDescriptorSet, IFileDescriptorSet } from 'protobufjs/ext/descriptor'
import { buildRoot } from './parser'

export const load = async (url: string): Promise<INamespace> => {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const descriptor = FileDescriptorSet.decode(bytes) as any as IFileDescriptorSet
  const root = buildRoot(descriptor)
  return root.toJSON({ keepComments: true })
}
