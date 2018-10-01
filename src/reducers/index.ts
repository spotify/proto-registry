import { combineReducers } from 'redux'
import nav, { INav } from './nav'
import recent, { IRecent } from './recent'
import ui, { IUI } from './ui'

export interface IState {
  nav: INav,
  recent: IRecent,
  ui: IUI,
}

export default combineReducers({
  nav,
  recent,
  ui
})
