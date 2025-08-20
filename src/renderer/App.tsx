import {ColorModeProvider} from '@/components/ui/color-mode'
import {Provider} from '@/components/ui/provider'
import {Toaster} from '@/components/ui/toaster'
// import {useRoutePaths, useSession} from "@render/hooks";
import {emitCustomEvent} from 'react-custom-events'
import {HashRouter} from 'react-router-dom'
import {SearchProvider} from './contexts/SearchContext/SearchContext'
import {AuthProvider} from './providers'
import {Router} from './router'
import {useEffect} from 'react'
import {initAnalytics} from './utils'

function App() {
  useEffect(() => {
    // App initialization
    console.log('[App] Initialized')
    
    // Initialize Google Analytics
    initAnalytics().catch(error => {
      console.warn('[App] Failed to initialize analytics:', error)
    })

    // Set up IPC message listener
    const handleIpcMessage = (message: any) => {
      console.log(`[App] emit custom event ${message.name}`)
      emitCustomEvent(message.name || 'unknown-message', message.data)
    }

    const cleanup = window.electron.onIpcMessage(handleIpcMessage)

    // Cleanup function to remove the listener
    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [])

  // const { isAuthenticated, user, signOut, signIn } = useSession()

  return (
    <Provider>
      <ColorModeProvider>
        <HashRouter>
          <AuthProvider>
            <SearchProvider>
              <Router />
            </SearchProvider>
          </AuthProvider>
        </HashRouter>
      </ColorModeProvider>
      <Toaster />
    </Provider>
  )
}

export default App
