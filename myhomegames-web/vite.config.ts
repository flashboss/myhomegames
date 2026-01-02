import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import path from 'path'

// Read package.json to get version
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Check if HTTPS is enabled via environment variable
  const HTTPS_ENABLED = env.VITE_HTTPS_ENABLED === 'true';
  
  return {
    base: '/app/',
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    server: {
      ...(HTTPS_ENABLED && {
        https: {
          key: readFileSync(path.resolve(__dirname, '../certs/key.pem')),
          cert: readFileSync(path.resolve(__dirname, '../certs/cert.pem')),
        },
      }),
      port: 5173,
    },
  }
})
