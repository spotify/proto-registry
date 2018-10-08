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
import actionCreatorFactory from 'typescript-fsa'

// Factory for actions related to navigation
const actionCreator = actionCreatorFactory('proto-registry/nav')

// We want to perform a free-text search.  The specified `query` is a free-text query.
export const search = actionCreator<{query: string}>('SEARCH')

// We want to select a specific Protobuf type.  The specified `type` is a fully-qualified Protobuf
// type, including the leading dot.
export const selectType = actionCreator<{type: string}>('SELECT_TYPE')

// We want to expand a specific Protobuf type in the tree, without selecting it.  The specified
// `type` is a fully-qualified Protobuf type, including the leading dot.
export const expandType = actionCreator<{type: string}>('EXPAND_TYPE')

// We want to collapse a specific Protobuf type in the tree, without selecting it.  The specified
// `type` is a fully-qualified Protobuf type, including the leading dot.
export const collapseType = actionCreator<{type: string}>('COLLAPSE_TYPE')

// We want to show the type tree.
export const showTree = actionCreator('SHOW_TREE')

// We want to hide the type tree.
export const hideTree = actionCreator('HIDE_TREE')
