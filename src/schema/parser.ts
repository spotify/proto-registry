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
import { Enum, Field, Method, NamespaceBase, OneOf, Root, Service, Type, util } from 'protobufjs'
import {
  EnumOptions,
  FieldOptions,
  FileOptions,
  IDescriptorProto,
  IEnumDescriptorProto,
  IFieldDescriptorProto,
  IFileDescriptorSet,
  IMethodDescriptorProto,
  IOneofDescriptorProto,
  IServiceDescriptorProto,
  MessageOptions,
  MethodOptions,
  ServiceOptions
} from 'protobufjs/ext/descriptor'

// This code is heavily tweaked from protobufjs/ext/descriptor to make it typesafe and add support
// for comments

interface ISourceCodeInfo {
  location: ILocation[]
}

interface ILocation {
  path: number[]
  span: number[]
  leadingComments?: string
  trailingComments?: string
  leadingDetachedComments?: string[]
}

const numberRe = /^(?![eE])[0-9]*(?:\.[0-9]*)?(?:[eE][+-]?[0-9]+)?$/

const FILE_MESSAGE_TYPE_LOCATION = 4
const FILE_ENUM_TYPE_LOCATION = 5
const FILE_SERVICE_LOCATION = 6
const FILE_EXTENSION_LOCATION = 7

const MESSAGE_FIELD_LOCATION = 2
const MESSAGE_NESTED_TYPE_LOCATION = 3
const MESSAGE_ENUM_TYPE_LOCATION = 4
const MESSAGE_EXTENSION_LOCATION = 6

const ENUM_VALUE_LOCATION = 2

const SERVICE_METHOD_LOCATION = 2

let unnamedMessageIndex = 0
let unnamedEnumIndex = 0
let unnamedOneofIndex = 0
let unnamedServiceIndex = 0
let unnamedMethodIndex = 0

export const buildRoot = (descriptor: IFileDescriptorSet): Root => {
  const root = new Root()

  if (descriptor.file) {
    for (const fileDescriptor of descriptor.file) {
      let filePackage: NamespaceBase = root
      const filename = fileDescriptor.name || null
      const sourceCodeInfo = fileDescriptor.sourceCodeInfo as ISourceCodeInfo | undefined
      const sourceLocations = sourceCodeInfo ? sourceCodeInfo.location : []

      if (fileDescriptor.package && fileDescriptor.package.length) {
        filePackage = root.define(fileDescriptor.package)
      }

      if (fileDescriptor.name && fileDescriptor.name.length) {
        filePackage.filename = fileDescriptor.name
        root.files.push(fileDescriptor.name)
      }

      if (fileDescriptor.messageType) {
        for (let i = 0; i < fileDescriptor.messageType.length; ++i) {
          const messageSourceLocations = sourceLocations.filter(isLocation(0, i, FILE_MESSAGE_TYPE_LOCATION))
          filePackage.add(buildType(fileDescriptor.messageType[i], messageSourceLocations, 2,
            filename, fileDescriptor.syntax))
        }
      }

      if (fileDescriptor.enumType) {
        for (let i = 0; i < fileDescriptor.enumType.length; ++i) {
          const enumSourceLocations = sourceLocations.filter(isLocation(0, i, FILE_ENUM_TYPE_LOCATION))
          filePackage.add(buildEnum(fileDescriptor.enumType[i], enumSourceLocations, 2, filename))
        }
      }

      if (fileDescriptor.extension) {
        for (let i = 0; i < fileDescriptor.extension.length; ++i) {
          const extensionSourceLocations = sourceLocations.filter(isLocation(0, i, FILE_EXTENSION_LOCATION))
          filePackage.add(buildField(fileDescriptor.extension[i], extensionSourceLocations, 2, filename))
        }
      }

      if (fileDescriptor.service) {
        for (let i = 0; i < fileDescriptor.service.length; ++i) {
          const serviceSourceLocations = sourceLocations.filter(isLocation(0, i, FILE_SERVICE_LOCATION))
          filePackage.add(buildService(fileDescriptor.service[i], serviceSourceLocations, 2, filename))
        }
      }

      const opts = fromDescriptorOptions(fileDescriptor.options, FileOptions)
      if (opts) {
        const ks = Object.keys(opts)
        for (const key of ks) {
          filePackage.setOption(key, opts[key])
        }
      }
    }
  }

  return root
}

const buildType = (descriptor: IDescriptorProto, sourceLocations: ILocation[],
                   sourcePathIndex: number, filename: string | null, syntax?: string): Type => {

  // Create the message type
  const name = descriptor.name
  const finalName = (name && name.length) ? name : 'Type' + unnamedMessageIndex++
  const typeOptions = fromDescriptorOptions(descriptor.options, MessageOptions)
  const type = new Type(finalName, typeOptions)

  type.filename = filename
  type.comment = extractComment(sourceLocations, sourcePathIndex)

  /* Oneofs */
  if (descriptor.oneofDecl) {
    for (const oneofDecl of descriptor.oneofDecl) {
      type.add(buildOneOf(oneofDecl, filename))
    }
  }

  /* Fields */
  if (descriptor.field) {
    for (let i = 0; i < descriptor.field.length; ++i) {
      const fieldSourceLocations =
        sourceLocations.filter(isLocation(sourcePathIndex, i, MESSAGE_FIELD_LOCATION))
      const field =
        buildField(descriptor.field[i], fieldSourceLocations, sourcePathIndex + 2, filename, syntax)
      type.add(field)
      if (descriptor.field[i].hasOwnProperty('oneofIndex')) {
        type.oneofsArray[descriptor.field[i].oneofIndex || 0].add(field)
      }
    }
  }

  /* Extension fields */
  if (descriptor.extension) {
    for (let i = 0; i < descriptor.extension.length; ++i) {
      const extensionSourceLocations =
        sourceLocations.filter(isLocation(sourcePathIndex, i, MESSAGE_EXTENSION_LOCATION))
      const field =
        buildField(descriptor.extension[i], extensionSourceLocations, sourcePathIndex + 2, filename, syntax)
      type.add(field)
    }
  }

  /* Nested types */
  if (descriptor.nestedType) {
    for (let i = 0; i < descriptor.nestedType.length; ++i) {
      const messageSourceLocations =
        sourceLocations.filter(isLocation(sourcePathIndex, i, MESSAGE_NESTED_TYPE_LOCATION))
      const nestedType =
        buildType(descriptor.nestedType[i], messageSourceLocations, sourcePathIndex + 2, filename, syntax)
      type.add(nestedType)

      const options = descriptor.nestedType[i].options
      if (options && options.mapEntry) {
        type.setOption('map_entry', true)
      }
    }
  }

  /* Nested enums */
  if (descriptor.enumType) {
    for (let i = 0; i < descriptor.enumType.length; ++i) {
      const enumSourceLocations = sourceLocations.filter(isLocation(sourcePathIndex, i, MESSAGE_ENUM_TYPE_LOCATION))
      type.add(buildEnum(descriptor.enumType[i], enumSourceLocations, sourcePathIndex + 2, filename))
    }
  }

  /* Extension ranges */
  if (descriptor.extensionRange && descriptor.extensionRange.length) {
    type.extensions = []
    for (const extensionRange of descriptor.extensionRange) {
      type.extensions.push([extensionRange.start || 0, extensionRange.end || 0])
    }
  }

  /* Reserved... */
  if (descriptor.reservedRange && descriptor.reservedRange.length ||
    descriptor.reservedName && descriptor.reservedName.length) {
    type.reserved = []

    /* Ranges */
    if (descriptor.reservedRange) {
      for (const reservedRange of descriptor.reservedRange) {
        type.reserved.push([reservedRange.start || 0, reservedRange.end || 0])
      }
    }

    /* Names */
    if (descriptor.reservedName) {
      for (const reservedName of descriptor.reservedName) {
        type.reserved.push(reservedName)
      }
    }
  }

  return type
}

const buildField = (descriptor: IFieldDescriptorProto, sourceLocations: ILocation[],
                    sourcePathIndex: number, filename: string | null, syntax?: string): Field => {
  if (typeof descriptor.number !== 'number') {
    throw Error('missing field id')
  }

  // Rewire field type
  let fieldType
  if (descriptor.typeName && descriptor.typeName.length) {
    fieldType = descriptor.typeName
  } else {
    fieldType = fromDescriptorType(descriptor.type)
  }

  // Rewire field rule
  let fieldRule
  switch (descriptor.label) {
    // 0 is reserved for errors
    case 1:
      fieldRule = undefined
      break
    case 2:
      fieldRule = 'required'
      break
    case 3:
      fieldRule = 'repeated'
      break
    default:
      throw Error('illegal label: ' + descriptor.label)
  }

  let extendee = descriptor.extendee
  if (extendee) {
    extendee = extendee.length ? extendee : undefined
  }
  const field = new Field(
    (descriptor.name && descriptor.name.length) ? descriptor.name : 'field' + descriptor.number,
    descriptor.number,
    fieldType,
    fieldRule,
    extendee
  )

  field.filename = filename
  field.comment = extractComment(sourceLocations, sourcePathIndex)

  field.options = fromDescriptorOptions(descriptor.options, FieldOptions)

  if (descriptor.defaultValue && descriptor.defaultValue.length) {
    let defaultValue: string | number | boolean = descriptor.defaultValue
    switch (defaultValue) {
      case 'true':
      case 'TRUE':
        defaultValue = true
        break
      case 'false':
      case 'FALSE':
        defaultValue = false
        break
      default:
        const match = numberRe.exec(defaultValue)
        if (match) {
          defaultValue = parseInt(defaultValue, 10)
        }
        break
    }
    field.setOption('default', defaultValue)
  }

  if (packableDescriptorType(descriptor.type)) {
    if (syntax === 'proto3') { // defaults to packed=true (internal preset is packed=true)
      if (descriptor.options && !descriptor.options.packed) {
        field.setOption('packed', false)
      }
    } else if (!(descriptor.options && descriptor.options.packed)) {// defaults to packed=false
      field.setOption('packed', false)
    }
  }

  return field
}

const buildEnum = (descriptor: IEnumDescriptorProto, sourceLocations: ILocation[],
                   sourcePathIndex: number, filename: string | null): Enum => {
  // Construct values object
  const values = {}
  const comments = {}
  if (descriptor.value) {
    for (let i = 0; i < descriptor.value.length; ++i) {
      const name = descriptor.value[i].name
      const value = descriptor.value[i].number || 0
      const finalName = name && name.length ? name : 'NAME' + value
      values[finalName] = value

      const enumValueSourceLocations =
        sourceLocations.filter(isLocation(sourcePathIndex, i, ENUM_VALUE_LOCATION))

      comments[finalName] = extractComment(enumValueSourceLocations, sourcePathIndex + 2)
    }
  }

  const enumeration = new Enum(
    descriptor.name && descriptor.name.length ? descriptor.name : 'Enum' + unnamedEnumIndex++,
    values,
    fromDescriptorOptions(descriptor.options, EnumOptions)
  )
  enumeration.filename = filename
  enumeration.comment = extractComment(sourceLocations, sourcePathIndex)

  return enumeration
}

const buildOneOf = (descriptor: IOneofDescriptorProto, filename: string | null): OneOf => {
  return new OneOf(
    // unnamedOneOfIndex is global, not per type, because we have no ref to a type here
    descriptor.name && descriptor.name.length ? descriptor.name : 'oneof' + unnamedOneofIndex++
    // fromDescriptorOptions(descriptor.options, exports.OneofOptions) - only uninterpreted_option
  )
}

const buildService = (descriptor: IServiceDescriptorProto, sourceLocations: ILocation[],
                      sourcePathIndex: number, filename: string | null): Service => {
  const finalName =
    descriptor.name && descriptor.name.length ? descriptor.name : 'Service' + unnamedServiceIndex++
  const serviceOptions = fromDescriptorOptions(descriptor.options, ServiceOptions)
  const service = new Service(finalName, serviceOptions)

  service.filename = filename
  service.comment = extractComment(sourceLocations, sourcePathIndex)

  if (descriptor.method) {
    for (let i = 0; i < descriptor.method.length; ++i) {
      const methodSourceLocations =
        sourceLocations.filter(isLocation(sourcePathIndex, i, SERVICE_METHOD_LOCATION))
      service.add(buildMethod(descriptor.method[i], methodSourceLocations, sourcePathIndex + 2, filename))
    }
  }

  return service
}

const buildMethod = (descriptor: IMethodDescriptorProto, sourceLocations: ILocation[],
                     sourcePathIndex: number, filename: string | null): Method => {
  const method = new Method(
    // unnamedMethodIndex is global, not per service, because we have no ref to a service here
    descriptor.name && descriptor.name.length ? descriptor.name : 'Method' + unnamedMethodIndex++,
    'rpc',
    descriptor.inputType || '',
    descriptor.outputType || '',
    Boolean(descriptor.clientStreaming),
    Boolean(descriptor.serverStreaming),
    fromDescriptorOptions(descriptor.options, MethodOptions)
  )

  method.filename = filename
  method.comment = extractComment(sourceLocations, sourcePathIndex)

  return method
}

const isLocation = (sourcePathIndex: number, index: number, locationType: number): (location: ILocation) => boolean => {
  return (l: ILocation) => l.path[sourcePathIndex] === locationType && l.path[sourcePathIndex + 1] === index
}

const extractComment = (sourceLocations: ILocation[], sourcePathIndex: number): string | null => {
  for (const location of sourceLocations) {
    if (location.path.length === sourcePathIndex) {
      const comment = location.leadingComments || location.trailingComments || null
      if (comment) {
        return comment
      }
    }
  }
  return null
}

const fromDescriptorType = (type: number | undefined): string => {
  switch (type) {
    // 0 is reserved for errors
    case 1:
      return 'double'
    case 2:
      return 'float'
    case 3:
      return 'int64'
    case 4:
      return 'uint64'
    case 5:
      return 'int32'
    case 6:
      return 'fixed64'
    case 7:
      return 'fixed32'
    case 8:
      return 'bool'
    case 9:
      return 'string'
    case 12:
      return 'bytes'
    case 13:
      return 'uint32'
    case 15:
      return 'sfixed32'
    case 16:
      return 'sfixed64'
    case 17:
      return 'sint32'
    case 18:
      return 'sint64'
  }
  throw Error('illegal type: ' + type)
}

const packableDescriptorType = (type: number | undefined): boolean => {
  switch (type) {
    case 1: // double
    case 2: // float
    case 3: // int64
    case 4: // uint64
    case 5: // int32
    case 6: // fixed64
    case 7: // fixed32
    case 8: // bool
    case 13: // uint32
    case 14: // enum (!)
    case 15: // sfixed32
    case 16: // sfixed64
    case 17: // sint32
    case 18: // sint64
      return true
  }
  return false
}

const fromDescriptorOptions = (options: any, type: any) => {
  if (!options) {
    return undefined
  }
  const out = []
  for (const field of type.fieldsArray) {
    const key = field.name
    if (key !== 'uninterpretedOption') {
      if (options.hasOwnProperty(key)) { // eslint-disable-line no-prototype-builtins
        let val = options[key]
        if (field.resolvedType instanceof Enum && typeof val === 'number' &&
          field.resolvedType.valuesById[val] !== undefined) {
          val = field.resolvedType.valuesById[val]
        }
        out.push(underScore(key), val)
      }
    }
  }
  return out.length ? util.toObject(out) : undefined
}

const underScore = (str: string) => {
  return str.substring(0, 1)
    + str.substring(1).replace(/([A-Z])(?=[a-z]|$)/g, ($0, $1) => '_' + $1.toLowerCase())
}
