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
import { Pre } from '@blueprintjs/core'
import { Enum, Namespace, ReflectionObject, Service, Type } from 'protobufjs/light'
import * as React from 'react'
import { formatEnum, formatNamespace, formatService, formatType } from './type-utils'

interface IProps {
  // The node to build an overview for
  node: ReflectionObject,
}

// A component that renders an "overview" of a type, which is a simplified version of the type's
// protobuf schema
export default class TypeOverview extends React.PureComponent<IProps> {
  public render () {
    const node = this.props.node
    let formatted
    if (node instanceof Type) {
      formatted = formatType(node)
    } else if (node instanceof Enum) {
      formatted = formatEnum(node)
    } else if (node instanceof Service) {
      formatted = formatService(node)
    } else if (node instanceof Namespace) {
      formatted = formatNamespace(node)
    } else {
      formatted = undefined
    }

    return (
      <Pre>
        // Simplified overview{'\n'}
        {formatted}
    </Pre>
    )
  }
}
