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
