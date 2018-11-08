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
import memoizeOne from 'memoize-one'
import * as React from 'react'
import { Link } from 'react-router-dom'

/* tslint:disable */
// Sadly this library is not ES6 module compatible
const ReactCommonmark = require('react-commonmark')

/* tslint:enable */

interface IProps {
  // The markdown source to display.
  source: string | null,
  // A mapping of extra link definitions for URLs that can be used in `[markdown style][link]`s.
  extraUrls: { [link: string]: string }
}

const formatUrlDefinitions = memoizeOne((urls: { [link: string]: string }): string => {
  const keys = Object.keys(urls)
  if (keys.length > 0) {
    return '\n\n' + Object.keys(urls).map((link) => `[${link}]: ${urls[link]}`).join('\n')
  } else {
    return ''
  }
})

// A component for displaying markdown comments consistently
export default class Comment extends React.PureComponent<IProps> {
  public render () {
    const { source, extraUrls } = this.props
    if (source) {
      return (
        <ReactCommonmark
          source={source + formatUrlDefinitions(extraUrls)}
          escapeHtml={true}
          renderers={{ link: this._link }}
        />
      )
    } else {
      return <p><em>(Documentation missing)</em></p>
    }
  }

  private _link = (props: {href: string, children: React.ReactNode[], title?: string, target?: string}) => {
    return <Link to={props.href} title={props.title} target={props.target}>{props.children}</Link>
  }
}
