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
import { Enum, Field, Method, Namespace, Service, Type } from 'protobufjs'
import * as React from 'react'
import { Link } from 'react-router-dom'

// This file is a bit of a mess because it needs to be very careful about formatting with correct
// indentation etc.

// Formats a message type as idealized protobuf, e.g.:
//
// message Foo {
//   option deprecated = true;
//   string bar = 1;
// }
export const formatType = (node: Type): React.ReactNode => {
  // TODO(dflemstr): render reserved
  const options = node.options
  let optionsNodes
  if (options) {
    const createOptionNode = (id: string) => (
      <React.Fragment key={id}>
        {'  '}{formatDeclaredOption(id, options[id])}{'\n'}
      </React.Fragment>
    )
    optionsNodes = Object.keys(options).sort().map(createOptionNode)
  } else {
    optionsNodes = undefined
  }

  const createFieldNode = (f: Field) => (
    <React.Fragment key={f.id}>{'  '}{formatField(f)}{'\n'}</React.Fragment>
  )
  const fieldsNodes = node.fieldsArray.map(createFieldNode)

  return (
    <React.Fragment key={node.fullName}>
      message {node.name} {'{\n'}{optionsNodes}{fieldsNodes}{'}\n'}
    </React.Fragment>
  )
}

// Formats a field as idealized protobuf, e.g.: `string foo = 1 [deprecated = true];`
export const formatField = (node: Field, withOptions: boolean = true): React.ReactNode => {
  // TODO(dflemstr): render map type, part of oneof, and extended message for extensions
  const options = node.options
  let optionsNodes
  if (withOptions && options) {
    const createOptionsNode = (id: string, i: number, arr: string[]) => {
      if (i === arr.length - 1) {
        return formatFieldOption(id, options[id])
      } else {
        return [formatFieldOption(id, options[id]), ', ']
      }
    }
    optionsNodes = [' [', Object.keys(options).sort().map(createOptionsNode), ']']
  } else {
    optionsNodes = undefined
  }

  const repeatedness = node.repeated ? 'repeated ' : undefined
  const requiredness = node.required ? 'required ' : undefined
  const typeRef = formatTypeReference(node.type, node.resolvedType)
  return (
    <React.Fragment>
      {repeatedness}{requiredness}{typeRef} {node.name} = {node.id}{optionsNodes};
    </React.Fragment>
  )
}

// Formats an enum as idealized protobuf, e.g.:
//
// enum Foo {
//   BAR = 1;
// }
export const formatEnum = (node: Enum): React.ReactNode => {
  // TODO(dflemstr): render options, reserved
  const createValueNode = (id: string) => (
    <React.Fragment key={id}>
      {'  '}{formatEnumValue(id, node.valuesById[id])}{'\n'}
    </React.Fragment>
  )
  const valuesNodes = Object.keys(node.valuesById)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).map(createValueNode)
  return <React.Fragment>enum {node.name} {'{\n'}{valuesNodes}{'}\n'}</React.Fragment>
}

// Formats an enum value as idealized protobuf, e.g.: `FOO = 1;`
export const formatEnumValue = (id: string, value: string): React.ReactNode => {
  return <React.Fragment>{value} = {id};</React.Fragment>
}

// Formats a service as idealized protobuf, e.g.:
//
// service Foo {
//   rpc Bar (BarRequest) returns (stream BarResponse);
// }
export const formatService = (node: Service): React.ReactNode => {
  // TODO(dflemstr): render options
  const createMethodNode = (m: Method) => (
    <React.Fragment key={m.name}>{'  '}{formatMethod(m)}{'\n'}</React.Fragment>
  )
  const methodNodes = node.methodsArray.map(createMethodNode)
  return <React.Fragment>service {node.name} {'{\n'}{methodNodes}{'}\n'}</React.Fragment>
}

// Formats an enum value as idealized protobuf, e.g.:
// `rpc Bar (BarRequest) returns (stream BarResponse);`
export const formatMethod = (node: Method): React.ReactNode => {
  // TODO(dflemstr): render options
  const requestStreaminess = node.requestStream ? 'stream ' : undefined
  const responseStreaminess = node.responseStream ? 'stream ' : undefined
  const requestRef = formatTypeReference(node.requestType, node.resolvedRequestType)
  const responseRef = formatTypeReference(node.responseType, node.resolvedResponseType)
  return (
    <React.Fragment key={node.fullName}>
      rpc {node.name} ({requestStreaminess}{requestRef})
      returns ({responseStreaminess}{responseRef});
    </React.Fragment>
  )
}

// Formats a package as idealized protobuf, e.g.: `package spotify.foo;`
export const formatNamespace = (node: Namespace): React.ReactNode => {
  return <React.Fragment>package {formatFullName(node.fullName)};</React.Fragment>
}

// Formats a declaration option as idealized protobuf, e.g.: `option foo = false;`
export const formatDeclaredOption = (id: string, node: any): React.ReactNode => {
  // TODO(dflemstr): distinguish built-in vs extension options
  return <React.Fragment>option {id} = {node};</React.Fragment>
}

// Formats a field option as idealized protobuf, e.g.: `foo = false`
export const formatFieldOption = (id: string, node: any): React.ReactNode => {
  // TODO(dflemstr): distinguish built-in vs extension options
  return <React.Fragment key={id}>{id} = {JSON.stringify(node)}</React.Fragment>
}

// Formats a type reference correctly, using a link when it refers to a known type.
export const formatTypeReference = (type: string,
                                    resolvedType: Type | Enum | null): React.ReactNode => {
  if (resolvedType !== null) {
    return <Link to={'/' + resolvedType.fullName.substr(1)}>{resolvedType.name}</Link>
  } else if (type.indexOf('.') !== -1) {
    return <em>{type} (unresolved)</em>
  } else {
    return type
  }
}

export const formatFullName = (fullName: string): string =>
    // Remove first '.', then use zero-width space to allow line breaks
    fullName.substr(1).replace(/\./g, '.\u200b')
