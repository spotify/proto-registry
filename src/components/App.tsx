import {
  Button,
  Classes,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  NonIdealState,
  Toaster
} from '@blueprintjs/core'
import * as React from 'react'
import { connect } from 'react-redux'
import actions from '../actions'
import * as reducers from '../reducers'
import schema, { all } from '../schema'
import './App.scss'
import TypeDocs from './TypeDocs'
import TypeSearch from './TypeSearch'
import TypeTree from './TypeTree'

interface IProps {
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

// The component that represents the entire registry application
class App extends React.PureComponent<IProps> {
  public render () {
    const {
      onHideTree, onShowTree, refToaster, selected, showTree,
      useDarkTheme, onUseDarkTheme, onUseLightTheme
    } = this.props
    const node = selected ? schema.lookup(selected) : null

    const onToggleTree = showTree ? onHideTree : onShowTree
    const onToggleTheme = useDarkTheme ? onUseLightTheme : onUseDarkTheme
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
            <TypeSearch nodes={all}/>
          </NavbarGroup>
        </Navbar>
      </header>
    )

    const content = node ? (
      <div className='bp3-running-text'>
        <TypeDocs node={node}/>
      </div>
    ) : (
      <NonIdealState
        icon='help'
        title='No schema type selected'
        description='Find a type by searching or selecting it in the hierarchy tree.'
        action={<TypeSearch nodes={all}/>}
      />
    )

    const main = (
      <main className='app-main'>
        <Toaster ref={refToaster}/>
        <nav className={'app-main-sidebar' + (showTree ? '' : ' hidden')}>
          <TypeTree roots={schema.nestedArray} selected={selected}/>
        </nav>
        <article className='app-main-content'>
          {content}
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
