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
// In production, we register a service worker to serve assets from local cache.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on the "N+1" visit to a page, since previously
// cached resources are updated in the background.

// To learn more about the benefits of this model, read https://goo.gl/KwvDNy.
// This link also includes instructions on opting out of this behavior.

/* global fetch */

import { Intent, Toaster } from '@blueprintjs/core'
import * as React from 'react'

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  // [::1] is the IPv6 localhost address.
  window.location.hostname === '[::1]' ||
  // 127.0.0.1/8 is considered localhost for IPv4.
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
)

export default function register (toasterSupplier: () => (Toaster | null)) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location as any as URL)
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebookincubator/create-react-app/issues/2374
      return
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`

      if (isLocalhost) {
        // This is running on localhost. Lets check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, toasterSupplier)
      } else {
        // Is not local host. Just register service worker
        registerValidSW(swUrl, toasterSupplier)
      }
    })
  }
}

function registerValidSW (swUrl: string, toasterSupplier: () => (Toaster | null)) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // At this point, the old content will have been purged and
                // the fresh content will have been added to the cache.
                // It's the perfect time to display a "New content is
                // available; please refresh." message in your web app.
                const toaster = toasterSupplier()
                if (toaster) {
                  toaster.show({
                    action: {
                      icon: 'refresh',
                      onClick: () => window.location.reload(),
                      text: <strong>Reload</strong>
                    },
                    icon: 'outdated',
                    intent: Intent.PRIMARY,
                    message: (
                      <React.Fragment>
                        The page has been updated in the background and new content is available.
                      </React.Fragment>
                    )
                  })
                }
              } else {
                // At this point, everything has been precached.
                // It's the perfect time to display a
                // "Content is cached for offline use." message.
                const toaster = toasterSupplier()
                if (toaster) {
                  toaster.show({
                    icon: 'info-sign',
                    intent: Intent.PRIMARY,
                    message: <React.Fragment>Content is cached for offline use.</React.Fragment>
                  })
                }
              }
            }
          }
        }
      }
    })
    .catch((error) => {
      const toaster = toasterSupplier()
      if (toaster) {
        toaster.show({
          icon: 'error',
          intent: Intent.DANGER,
          message: <React.Fragment>Could not register service worker:{error}</React.Fragment>
        })
      }
    })
}

function checkValidServiceWorker (swUrl: string, toasterSupplier: () => (Toaster | null)) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl)
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      if (
        response.status === 404 ||
        (response.headers.get('content-type') || '').indexOf('javascript') === -1
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          return registration.unregister().then(() => {
            window.location.reload()
          })
        }).catch(() => {/* do nothing */})
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, toasterSupplier)
      }
    })
    .catch(() => {
      const toaster = toasterSupplier()
      if (toaster) {
        toaster.show({
          icon: 'offline',
          intent: Intent.PRIMARY,
          message: (
            <React.Fragment>
              No internet connection found. The page is running in offline mode.
            </React.Fragment>
          )
        })
      }
    })
}

export function unregister () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.unregister()
    }).catch(() => {/* do nothing */})
  }
}
