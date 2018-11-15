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
import { IconName, ITreeNode, Tree } from '@blueprintjs/core'
import {
  Enum,
  Field,
  MapField,
  Method,
  Namespace,
  OneOf,
  ReflectionObject,
  Service,
  Type
} from 'protobufjs'
import * as React from 'react'
import { connect } from 'react-redux'
import { routerActions } from 'react-router-redux'
import actions from '../actions'
import * as reducers from '../reducers'
import './TypeTree.scss'

interface IProps {
  // The roots of the tree; this corresponds to all root-level Protobuf packages
  readonly roots: ReadonlyArray<ReflectionObject>
  // The fully qualified names of types that are expanded (e.g. [".spotify", ".spotify.metadata"] to
  // expand the `spotify.metadata` package)
  readonly expanded: ReadonlyArray<string>
  // The fully qualified name of the currently selected type, if any.
  readonly selected: null | string
  // Called when the user requests a type to be expanded
  readonly onExpanded: (fullName: string) => void
  // Called when the user requests a type to be collapsed
  readonly onCollapse: (fullName: string) => void
  // Called when the user requests a type to be selected
  readonly onSelected: (fullName: string) => void
}

// A component that renders a Protobuf type hierarchy as a tree
class TypeTree extends React.PureComponent<IProps> {
  public render () {
    const roots =
      this.props.roots.map((c) => buildTree(c, this.props.selected, this.props.expanded))
    return (
      <Tree
        className='type-tree'
        contents={roots}
        onNodeExpand={this.onNodeExpand}
        onNodeCollapse={this.onNodeCollapse}
        onNodeClick={this.onNodeClick}
      />
    )
  }

  private onNodeExpand = (node: ITreeNode<ReflectionObject>) =>
    node.nodeData && this.props.onExpanded(node.nodeData.fullName)

  private onNodeCollapse = (node: ITreeNode<ReflectionObject>) =>
    node.nodeData && this.props.onCollapse(node.nodeData.fullName)

  private onNodeClick = (node: ITreeNode<ReflectionObject>) =>
    node.nodeData && this.props.onSelected(node.nodeData.fullName)
}

const buildTree = (node: ReflectionObject, selected: null | string,
                   expanded: ReadonlyArray<string>): ITreeNode<ReflectionObject> => {
  let childNodes: Array<ITreeNode<ReflectionObject>>
  if ('nestedArray' in node) {
    const typedNode = node as ReflectionObject & { nestedArray: ReflectionObject[] }
    childNodes = typedNode.nestedArray
      .sort((a: ReflectionObject, b: ReflectionObject) => a.fullName.localeCompare(b.fullName))
      .map((c: ReflectionObject) => buildTree(c, selected, expanded))
  } else {
    childNodes = []
  }

  let icon: IconName
  if (node instanceof Type) {
    icon = 'document'
  } else if (node instanceof Enum) {
    icon = 'properties'
  } else if (node instanceof Field) {
    icon = 'widget-button'
  } else if (node instanceof MapField) {
    icon = 'widget-button'
  } else if (node instanceof Service) {
    icon = 'graph'
  } else if (node instanceof Method) {
    icon = 'send-to-graph'
  } else if (node instanceof OneOf) {
    icon = 'group-objects'
  } else if (node instanceof Namespace) {
    icon = 'folder-close'
  } else {
    icon = 'blank'
  }

  return {
    childNodes,
    hasCaret: childNodes.length > 0,
    icon,
    id: node.fullName,
    isExpanded: expanded.indexOf(node.fullName) !== -1,
    isSelected: selected !== null && (node.fullName === selected),
    label: node.name,
    nodeData: node
  }
}

export default connect((state: reducers.IState) => ({
  expanded: state.nav.expandedTypes
}), (dispatch) => ({
  onCollapse: (fullName: string) => dispatch(actions.nav.collapseType({ type: fullName })),
  onExpanded: (fullName: string) => dispatch(actions.nav.expandType({ type: fullName })),
  onSelected: (fullName: string) => {
    dispatch(routerActions.push('/' + fullName.substr(1)))
    dispatch(actions.nav.selectType({ type: fullName }))
  }
}))(TypeTree)
