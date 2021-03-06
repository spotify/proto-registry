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
import { Toaster } from '@blueprintjs/core'
import createHistory from 'history/createMemoryHistory'
import { Root } from 'protobufjs'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { ConnectedRouter, routerMiddleware } from 'react-router-redux'
import { applyMiddleware, createStore } from 'redux'
import reducers from '../reducers'
import { Schema } from '../schema'
import App from './App'

// A simple sanity end-to-end test
it('renders without crashing', () => {
  const history = createHistory()
  const store = createStore(reducers, applyMiddleware(routerMiddleware(history)))

  const refToaster = (toaster: Toaster) => {/* do nothing */}
  const schema = Promise.resolve(new Schema(Root.fromJSON({
    nested: {
      AwesomeMessage: {
        fields: {
          awesomeField: {
            id: 1,
            type: 'string'
          }
        }
      }
    }
  })))
  const component = (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <App refToaster={refToaster} schema={schema}/>
      </ConnectedRouter>
    </Provider>
  )

  const div = document.createElement('div')
  ReactDOM.render(component, div)
  ReactDOM.unmountComponentAtNode(div)
})
