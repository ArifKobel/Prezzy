import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    viteReact(),
  ],
  resolve: {
    alias: [
      {
        find: '@tanstack/react-start/server',
        replacement: fileURLToPath(new URL('./src/tests/browser/start-server-stub.ts', import.meta.url)),
      },
      {
        find: /^@tanstack\/react-start$/,
        replacement: fileURLToPath(new URL('./src/tests/browser/start-stub.ts', import.meta.url)),
      },
    ],
  },
  test: {
    name: 'browser',
    include: ['src/**/*.browser.test.{ts,tsx}'],
    setupFiles: ['./src/tests/browser/setup.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      screenshotFailures: false,
      viewport: { width: 1280, height: 800 },
      instances: [{ browser: 'chromium' }],
    },
  },
})
