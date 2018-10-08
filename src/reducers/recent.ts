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
