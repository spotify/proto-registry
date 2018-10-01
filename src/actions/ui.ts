import actionCreatorFactory from 'typescript-fsa'

// Factory for actions related to UI
const actionCreator = actionCreatorFactory('proto-registry/ui')

// We want to use the dark theme.
export const useDarkTheme = actionCreator('USE_DARK_THEME')

// We want to use the light theme.
export const useLightTheme = actionCreator('USE_LIGHT_THEME')
