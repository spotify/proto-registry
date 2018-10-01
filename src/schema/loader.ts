import { FileDescriptorSet, IFileDescriptorSet } from 'protobufjs/ext/descriptor'
import { Schema } from './index'
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
