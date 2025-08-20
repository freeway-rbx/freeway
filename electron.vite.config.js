import {resolve} from 'node:path'
import react from '@vitejs/plugin-react'
import {defineConfig, externalizeDepsPlugin, swcPlugin} from 'electron-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import 'dotenv/config'


export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@common': resolve('src/main/common'),
        '@preload': resolve('src/preload'),
      },
    },
    plugins: [externalizeDepsPlugin(), swcPlugin()],
    define: {
      __VITE_SENTRY_DSN__: JSON.stringify(process.env.VITE_SENTRY_DSN),
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer'),
        '@render': resolve('src/renderer'),
        '@components': resolve('src/renderer/components'),
      },
    },
    plugins: [react(), tsconfigPaths()],
  },
})
