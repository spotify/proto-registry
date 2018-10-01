import { matchPath } from 'react-router'
import { LOCATION_CHANGE, LocationChangeAction } from 'react-router-redux'
import { Action } from 'redux'
import { isType } from 'typescript-fsa'
import actions from '../actions'

export interface INav {
  // The currently selected type
  readonly type: string | null,
  // Types that are expanded in the browse tree
  readonly expandedTypes: ReadonlyArray<string>,
  // The current search query, if any
  readonly query: null | string,
  // Whether to show the browse tree
  readonly showTree: boolean,
}

const INITIAL_STATE: INav = {
  expandedTypes: [],
  query: null,
  showTree: true,
  type: null
}

// Generates the IDs of all parent types for a given type (including the type itself).
const withParentTypes = (type: string): string[] => {
  const newExpandedTypes = []
  for (let i = type.length; i > 0; i = type.lastIndexOf('.', i - 1)) {
    newExpandedTypes.push(type.substr(0, i))
  }
  return newExpandedTypes
}

// Makes the specified type the selected type, making sure to expand any parent nodes.
const makeSelected = (type: string, state: INav): INav => {
  const newExpandedTypes = withParentTypes(type)
  // explicitly don't include self; only expand the path to self
  newExpandedTypes.splice(newExpandedTypes.indexOf(type), 1)
  return { ...state, type, expandedTypes: state.expandedTypes.concat(newExpandedTypes), query: null }
}

// A reducer that handles user navigation
export default (state: INav = INITIAL_STATE, action: Action): INav => {
  if (isType(action, actions.nav.selectType)) {
    return makeSelected(action.payload.type, state)
  }

  if (isType(action, actions.nav.expandType)) {
    const newExpandedTypes = withParentTypes(action.payload.type)
    return { ...state, expandedTypes: state.expandedTypes.concat(newExpandedTypes) }
  }

  if (isType(action, actions.nav.collapseType)) {
    // This makes sure to also collapse any child nodes
    const expandedTypes = state.expandedTypes.filter((t) => !t.startsWith(action.payload.type))
    return {
      ...state,
      expandedTypes
    }
  }

  if (isType(action, actions.nav.search)) {
    return { ...state, query: action.payload.query }
  }

  if (isType(action, actions.nav.showTree)) {
    return { ...state, showTree: true }
  }

  if (isType(action, actions.nav.hideTree)) {
    return { ...state, showTree: false }
  }

  if (action.type === LOCATION_CHANGE) {
    const locationChangeAction = action as LocationChangeAction
    const match = matchPath(locationChangeAction.payload.pathname, { path: '/:fullName' })
    if (match) {
      const params = match.params
      if ('fullName' in params) {
        const typedParams = params as {fullName: string}
        const type = '.' + typedParams.fullName
        return makeSelected(type, state)
      }
    }
  }

  return state
}
