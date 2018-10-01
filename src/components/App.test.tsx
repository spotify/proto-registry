import { Toaster } from '@blueprintjs/core'
import createHistory from 'history/createMemoryHistory'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { ConnectedRouter, routerMiddleware } from 'react-router-redux'
import { applyMiddleware, createStore } from 'redux'
import reducers from '../reducers'
import App from './App'

// A simple sanity end-to-end test
it('renders without crashing', () => {
  const history = createHistory()
  const store = createStore(reducers, applyMiddleware(routerMiddleware(history)))

  const refToaster = (toaster: Toaster) => {/* do nothing */}
  const component = (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <App refToaster={refToaster}/>
      </ConnectedRouter>
    </Provider>
  )

  const div = document.createElement('div')
  ReactDOM.render(component, div)
  ReactDOM.unmountComponentAtNode(div)
})
