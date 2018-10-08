/* Copyright 2018 Spotify AB. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
