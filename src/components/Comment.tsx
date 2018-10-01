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
