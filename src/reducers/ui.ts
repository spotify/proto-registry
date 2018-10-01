import { Action } from 'redux'
import { isType } from 'typescript-fsa'
import actions from '../actions'

export interface IUI {
  // Whether to use the dark theme
  readonly darkTheme: boolean
}

const INITIAL_STATE: IUI = {
  darkTheme: false
}

// A reducer that controls UI/purely aesthetical aspects of the experience
export default (state: IUI = INITIAL_STATE, action: Action) => {
  if (isType(action, actions.ui.useDarkTheme)) {
    return {
      ...state,
      darkTheme: true
    }
  }

  if (isType(action, actions.ui.useLightTheme)) {
    return {
      ...state,
      darkTheme: false
    }
  }

  return state
}
