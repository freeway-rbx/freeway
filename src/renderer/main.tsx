import * as Sentry from '@sentry/electron/renderer'
import ReactDOM from 'react-dom/client'
import App from './App'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 1.0,
  attachStacktrace: true,
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />,
)
