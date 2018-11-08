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
import { H1, H2 } from '@blueprintjs/core'
import memoizeOne from 'memoize-one'
import { Enum, Field, Method, Namespace, OneOf, ReflectionObject, Service, Type } from 'protobufjs'
import * as React from 'react'
import Comment from './Comment'
import { formatEnumValue, formatField, formatFullName, formatMethod } from './type-utils'
import './TypeDocs.scss'
import TypeOverview from './TypeOverview'

interface IProps {
  // The node to be documented.
  node: ReflectionObject,
  // All known nodes
  all: ReadonlyArray<ReflectionObject>,
}

const buildUrls = memoizeOne((all: ReadonlyArray<ReflectionObject>) =>
all.reduce((result, current) => {
  result[current.fullName] = '/' + current.fullName.substr(1)
  return result
}, {}))

// A component that renders a documentation page for a specific Protobuf type.
class TypeDocs extends React.PureComponent<IProps> {
  public render () {
    const { node, all } = this.props
    const extraUrls = buildUrls(all)
    let kind
    let sections
    if (node instanceof Type) {
      kind = 'message'
      const oneofSections = node.oneofsArray.map((oneof) => createOneofSection(oneof, extraUrls))
      const fieldSections = node.fieldsArray.map((field) => createFieldSection(field, extraUrls))
      sections = oneofSections.concat(fieldSections)
    } else if (node instanceof Enum) {
      kind = 'enum'
      const enumValueSectionCreator = (id: string) =>
        createEnumValueSection(node.valuesById[id], id, node.comments[node.valuesById[id]], extraUrls)
      sections = Object.keys(node.valuesById).map(enumValueSectionCreator)
    } else if (node instanceof Service) {
      kind = 'service'
      sections = node.methodsArray.map((method) => createMethodSection(method, extraUrls))
    } else if (node instanceof Namespace) {
      kind = 'package'
    } else {
      kind = 'unknown'
    }
    const name = formatFullName(node.fullName)

    return (
      <React.Fragment>
        <H1 className='type-docs-heading bp3-monospace-text'>
          {name}
          <small> ({kind})</small>
        </H1>
        {node.filename && <p>Defined in: <code>{node.filename}</code></p>}
        <TypeOverview node={node}/>
        <Comment source={node.comment} extraUrls={extraUrls}/>
        {sections}
      </React.Fragment>
    )
  }
}

const createFieldSection = (node: Field, extraUrls: {[link: string]: string}): React.ReactNode => {
  const id = `field:${node.name}`
  return (
    <React.Fragment key={id}>
      <H2 className='type-docs-subheading bp3-monospace-text'>{formatField(node, false)}</H2>
      <Comment source={node.comment} extraUrls={extraUrls}/>
    </React.Fragment>
  )
}
const createOneofSection = (node: OneOf, extraUrls: {[link: string]: string}): React.ReactNode => {
  const id = `oneof:${node.name}`
  return (
    <React.Fragment key={id}>
      <H2 className='type-docs-subheading bp3-monospace-text'>oneof {node.name} {'{\u2026}'}</H2>
      <Comment source={node.comment} extraUrls={extraUrls}/>
      <p><strong>Affected fields:</strong></p>
      <ul>{node.oneof.map((o) => <li key={o}>{o}</li>)}</ul>
    </React.Fragment>
  )
}

const createEnumValueSection = (name: string, num: string,
                                comment: string | null, extraUrls: {[link: string]: string}): React.ReactNode => {
  const id = `value:${name}`
  return (
    <React.Fragment key={id}>
      <H2 className='type-docs-subheading bp3-monospace-text'>{formatEnumValue(num, name)}</H2>
      <Comment source={comment} extraUrls={extraUrls}/>
    </React.Fragment>
  )
}

const createMethodSection = (node: Method, extraUrls: {[link: string]: string}): React.ReactNode => {
  const id = `method:${node.name}`
  return (
    <React.Fragment key={id}>
      <H2 className='type-docs-subheading bp3-monospace-text'>{formatMethod(node)}</H2>
      <Comment source={node.comment} extraUrls={extraUrls}/>
    </React.Fragment>
  )
}

export default TypeDocs
