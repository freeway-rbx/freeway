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
      __GA_MEASUREMENT_ID__: JSON.stringify(process.env.GA_MEASUREMENT_ID),
      __GA_API_SECRET__: JSON.stringify(process.env.GA_API_SECRET),
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
