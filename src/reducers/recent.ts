import { Action } from 'redux'
import { isType } from 'typescript-fsa'
import actions from '../actions'

export interface IRecent {
  // The IDs of recently seen nodes
  readonly recent: ReadonlyArray<string>
}

const INITIAL_STATE: IRecent = {
  recent: []
}

// Max recent history to keep
const MAX_RECENT = 10

// A reducer that keeps track of recently seen nodes
export default (state: IRecent = INITIAL_STATE, action: Action) => {
  if (isType(action, actions.nav.selectType)) {
    const recentWithoutCurrent = state.recent.filter((oldType) => oldType !== action.payload.type)
    return {
      ...state,
      recent: [action.payload.type].concat(recentWithoutCurrent).slice(0, MAX_RECENT)
    }
  }

  return state
}
