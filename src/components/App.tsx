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
import {
  Button,
  Classes,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  NonIdealState,
  Spinner,
  Toaster
} from '@blueprintjs/core'
import * as React from 'react'
import { connect } from 'react-redux'
import actions from '../actions'
import * as reducers from '../reducers'
import { Schema } from '../schema'
import './App.scss'
import TypeDocs from './TypeDocs'
import TypeSearch from './TypeSearch'
import TypeTree from './TypeTree'

interface IProps {
  readonly schema: Promise<Schema>,
  // The fully qualified name of the selected Protobuf type
  readonly selected: null | string,
  // Whether to render using the dark theme
  readonly useDarkTheme: boolean,
  // Whether to show the browse tree
  readonly showTree: boolean,
  // Called when the user requests the tree to be shown
  readonly onShowTree: () => void,
  // Called when the user requests the tree to be hidden
  readonly onHideTree: () => void,
  // Called when the user wants to use the dark theme
  readonly onUseDarkTheme: () => void,
  // Called when the user wants to use the light theme
  readonly onUseLightTheme: () => void,
  // Called when a toaster has been created
  readonly refToaster: (toaster: Toaster) => void,
}

interface IState {
  readonly schema: Schema | null,
  readonly error: Error | null
}

// The component that represents the entire registry application
class App extends React.PureComponent<IProps, IState> {
  public state: IState = { schema: null, error: null }
  private mounted: boolean = false

  public componentDidMount () {
    this.mounted = true
    this.props.schema.then((schema) => {
      if (this.mounted) {
        this.setState({ ...this.state, schema, error: null })
      }
    }, (error) => {
      if (this.mounted) {
        this.setState({ ...this.state, error })
      }
    })
  }

  public componentWillUnmount () {
    this.mounted = false
  }

  public render () {
    const {
      onHideTree, onShowTree, refToaster, selected, showTree,
      useDarkTheme, onUseDarkTheme, onUseLightTheme
    } = this.props
    const { error, schema } = this.state

    let node
    if (schema !== null && selected !== null) {
      node = schema.root.lookup(selected)
    } else {
      node = null
    }

    const onToggleTree = showTree ? onHideTree : onShowTree
    const onToggleTheme = useDarkTheme ? onUseLightTheme : onUseDarkTheme

    let mainContent
    if (node) {
      mainContent = (
        <div className='bp3-running-text'>
          <TypeDocs node={node}/>
        </div>
      )
    } else if (schema) {
      mainContent = (
        <NonIdealState
          icon='help'
          title='No schema type selected'
          description='Find a type by searching or selecting it in the hierarchy tree.'
          action={<TypeSearch nodes={schema.all}/>}
        />
      )
    } else if (error) {
      mainContent = (
        <NonIdealState
          icon='error'
          title='Failed to load schema'
          description={error.message}
        />
      )
    } else {
      mainContent = <Spinner/>
    }

    let typeSearch
    let typeTree
    if (schema) {
      typeSearch = <TypeSearch nodes={schema.all}/>
      typeTree = <TypeTree roots={schema.root.nestedArray} selected={selected}/>
    } else if (error) {
      typeSearch = undefined
      typeTree = undefined
    } else {
      typeSearch = <Spinner size={Spinner.SIZE_SMALL}/>
      typeTree = <Spinner/>
    }

    const header = (
      <header className='app-header'>
        <Navbar>
          <NavbarGroup>
            <NavbarHeading>Schema Registry</NavbarHeading>
            <NavbarDivider/>
            <Button
              className={Classes.MINIMAL}
              icon='diagram-tree'
              onClick={onToggleTree}
              active={showTree}
            />
            <Button
              className={Classes.MINIMAL}
              icon={useDarkTheme ? 'flash' : 'moon'}
              onClick={onToggleTheme}
              active={useDarkTheme}
            />
            <NavbarDivider/>
            {typeSearch}
          </NavbarGroup>
        </Navbar>
      </header>
    )

    const main = (
      <main className='app-main'>
        <Toaster ref={refToaster}/>
        <nav className={'app-main-sidebar' + (showTree ? '' : ' hidden')}>
          {typeTree}
        </nav>
        <article className='app-main-content'>
          {mainContent}
        </article>
      </main>
    )

    return (
      <section className={'app' + (useDarkTheme ? ' ' + Classes.DARK : '')}>
        {header}
        {main}
      </section>
    )
  }
}

export default connect(
  (state: reducers.IState) => ({
    selected: state.nav.type,
    showTree: state.nav.showTree,
    useDarkTheme: state.ui.darkTheme
  }),
  (dispatch) => ({
    onHideTree: () => dispatch(actions.nav.hideTree()),
    onShowTree: () => dispatch(actions.nav.showTree()),
    onUseDarkTheme: () => dispatch(actions.ui.useDarkTheme()),
    onUseLightTheme: () => dispatch(actions.ui.useLightTheme())
  })
)(App)
