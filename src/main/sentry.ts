import * as Sentry from '@sentry/electron/main'

Sentry.init({
  dsn: __VITE_SENTRY_DSN__,
  tracesSampleRate: 1.0,
  attachStacktrace: true,
})