import * as React from 'react'

/* tslint:disable */
// Sadly this library is not ES6 module compatible
const ReactCommonmark = require('react-commonmark')
/* tslint:enable */

interface IProps {
  // The markdown source to display.
  source: string | null
}

// A component for displaying markdown comments consistently
export default class Comment extends React.PureComponent<IProps> {
  public render () {
    const source = this.props.source
    if (source) {
      return <ReactCommonmark source={source}/>
    } else {
      return <p><em>(Documentation missing)</em></p>
    }
  }
}
