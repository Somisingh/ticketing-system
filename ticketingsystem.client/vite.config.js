import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import plugin from '@vitejs/plugin-react'
import { env } from 'process'



// Backend API URL - .NET server
const backendUrl = env.ASPNETCORE_HTTPS_PORT
  ? `http://localhost:${env.ASPNETCORE_HTTPS_PORT}`
  : env.ASPNETCORE_URLS
    ? env.ASPNETCORE_URLS.split(';')[0]
    : 'http://localhost:5076'

export default defineConfig({
    plugins: [
    tailwindcss(),
    plugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
    },
    test: {
        environment: 'jsdom',           // Simulate a browser environment
        globals: true,                  // Use describe/it/expect without imports
        setupFiles: './src/test-setup.js',
    },
  server: {
    // HTTP only - no SSL cert required
    host: 'localhost',
    port: parseInt(env.DEV_SERVER_PORT || '59320'),
    strictPort: true,
    proxy: {
      // Proxy /api/* to the .NET backend (strips /api prefix)
      '^/api/': {
        target: backendUrl,
        secure: false,
        changeOrigin: true,
     //   rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
