import { defineConfig } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  base: '/steerhead-game/',
  resolve: { tsconfigPaths: true },
  plugins: [
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),

    tanstackStart({
      spa: { enabled: true },
      router: { basepath: '/steerhead-game' },
    }),
    viteReact(),
  ],
})

export default config
