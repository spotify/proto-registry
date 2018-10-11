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
import { MenuItem } from '@blueprintjs/core'
import { IItemRendererProps, Suggest } from '@blueprintjs/select'
import { Enum, Namespace, ReflectionObject, Service, Type } from 'protobufjs/light'
import * as React from 'react'
import { connect } from 'react-redux'
import { routerActions } from 'react-router-redux'
import actions from '../actions'
import * as reducers from '../reducers'

/* tslint:disable */
// Sadly this library is not ES6 module compatible
const Fuse = require('fuse.js')

/* tslint:enable */

interface IProps {
  // The nodes to search
  nodes: ReflectionObject[],
  // Recently searched/selected nodes, to be shown as suggestions before the user starts searching
  recent: ReadonlyArray<string>,
  // Called when the user requests a type to be selected
  onSelected: (fullName: string) => void
}

const NodeSuggest = Suggest.ofType<ReflectionObject>()

// A component that provides a search field for types.
class TypeSearch extends React.PureComponent<IProps> {
  public render () {
    return (
      <NodeSuggest
        items={this.props.nodes}
        inputValueRenderer={this.inputValueRenderer}
        itemRenderer={renderNode}
        itemListPredicate={this.itemListPredicate}
        onItemSelect={this.onItemSelect}
        popoverProps={{ minimal: true }}
      />
    )
  }

  private inputValueRenderer = (node: ReflectionObject) => node.fullName.substr(1)

  private itemListPredicate = (query: string, items: ReflectionObject[]): ReflectionObject[] =>
    searchNodes(query, items, this.props.recent)

  private onItemSelect = (node: ReflectionObject) => this.props.onSelected(node.fullName)
}

const renderNode = (node: ReflectionObject, props: IItemRendererProps): JSX.Element => {
  const { modifiers, handleClick } = props

  let kind
  if (node instanceof Type) {
    kind = 'message'
  } else if (node instanceof Enum) {
    kind = 'enum'
  } else if (node instanceof Service) {
    kind = 'service'
  } else if (node instanceof Namespace) {
    kind = 'package'
  } else {
    kind = 'unknown'
  }

  const text = (
    <React.Fragment>{node.name}
      <small> ({kind})</small>
    </React.Fragment>
  )
  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      label={node.fullName.substr(1)}
      key={node.fullName}
      onClick={handleClick}
      text={text}
    />
  )
}

const searchNodes = (query: string, items: ReflectionObject[], recent: ReadonlyArray<string>): ReflectionObject[] => {
  if (query.length === 0) {
    const recentHits = []
    for (const item of items) {
      const recentIndex = recent.indexOf(item.fullName)
      if (recentIndex !== -1) {
        recentHits[recentIndex] = item
      }
    }

    // The x => true part is a trick to remove indices that were not populated in the above loop; i.e.
    // when our `recent` array contains types that no longer exist.
    // The idea here is to show recent items in order first, and then the remaining items in
    // arbitrary order.  This could of course be done much much more efficiently.
    return recentHits.filter((x) => true).concat(items.filter((n) => recent.indexOf(n.fullName) === -1)).slice(0, 10)
  } else {
    // TODO(dflemstr): this builds a new search index every time. Maybe we should memoize
    // With the current implementation of Fuse it looks like it wouldn't make a huge difference,
    // since the graph is analyzed on every search anyway
    return new Fuse(items, {
      distance: 100,
      keys: [
        'fullName',
        'comment'
      ],
      location: 0,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      shouldSort: true,
      threshold: 0.6
    }).search(query).slice(0, 10)
  }
}

export default connect((state: reducers.IState) => ({
  recent: state.recent.recent
}), (dispatch) => ({
  onSelected: (fullName: string) => {
    dispatch(routerActions.push('/' + fullName.substr(1)))
    dispatch(actions.nav.selectType({ type: fullName }))
  }
}))(TypeSearch)
