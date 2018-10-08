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
