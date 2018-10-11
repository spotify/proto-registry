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
import { INamespace, Namespace, Root } from 'protobufjs/light'
import { Schema } from './index'
import * as worker from './loader.worker'

interface IWorker {
  load (url: string): Promise<INamespace>

  terminate (): void
}

export class SchemaLoader {
  private url: string

  constructor (url: string) {
    this.url = url
  }

  public load (): Promise<Schema> {
    const workerInstance = (worker as any)() as IWorker
    return workerInstance.load(this.url).then((data) => {

      // XXX(dflemstr): monkey patch awaiting this PR: https://github.com/dcodeIO/protobuf.js/pull/1122
      Namespace.isReservedId = function isReservedId (reserved: Array<number[] | string>, id: number) {
        if (reserved) {
          for (const reservedElem of reserved) {
            if (typeof reservedElem !== 'string' && reservedElem[0] <= id && reservedElem[1] > id) {
              return true
            }
          }
        }
        return false
      }

      try {
        return new Schema(Root.fromJSON(data))
      } catch (err) {
        throw Error(`Failed to post-process schema from ${this.url}: ${err.message}`)
      }
    }, (err) => {
      throw Error(`Failed to load schema from ${this.url}: ${err.message}`)
    })
  }
}
