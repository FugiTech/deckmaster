export const client_id = 'cplheah4pxjyuwe9mkno9kbmb11lyc'
export const serverURL = 's://deckmaster.fugi.tech'

import * as Sentry from '@sentry/electron'

export function captureMessage(m, extra) {
  Sentry.getDefaultHub().withScope(() => {
    Sentry.getDefaultHub().configureScope(scope => {
      for (let [k, v] of Object.entries(extra || {})) {
        scope.setExtra(k, v)
      }
      Sentry.captureMessage(m)
    })
  })
}

export function captureException(e, extra) {
  Sentry.getDefaultHub().withScope(() => {
    Sentry.getDefaultHub().configureScope(scope => {
      for (let [k, v] of Object.entries(extra || {})) {
        scope.setExtra(k, v)
      }
      Sentry.captureException(e)
    })
  })
}
