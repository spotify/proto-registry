import actionCreatorFactory from 'typescript-fsa'

// Factory for actions related to navigation
const actionCreator = actionCreatorFactory('proto-registry/nav')

// We want to perform a free-text search.  The specified `query` is a free-text query.
export const search = actionCreator<{query: string}>('SEARCH')

// We want to select a specific Protobuf type.  The specified `type` is a fully-qualified Protobuf
// type, including the leading dot.
export const selectType = actionCreator<{type: string}>('SELECT_TYPE')

// We want to expand a specific Protobuf type in the tree, without selecting it.  The specified
// `type` is a fully-qualified Protobuf type, including the leading dot.
export const expandType = actionCreator<{type: string}>('EXPAND_TYPE')

// We want to collapse a specific Protobuf type in the tree, without selecting it.  The specified
// `type` is a fully-qualified Protobuf type, including the leading dot.
export const collapseType = actionCreator<{type: string}>('COLLAPSE_TYPE')

// We want to show the type tree.
export const showTree = actionCreator('SHOW_TREE')

// We want to hide the type tree.
export const hideTree = actionCreator('HIDE_TREE')
