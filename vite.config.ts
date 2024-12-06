import { defineConfig, PluginOption, UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@/': `${resolve(__dirname, 'src')}/`
    }
  },
  build: {
    minify: true,
    outDir: 'dist',
    emptyOutDir: true
  }
} satisfies UserConfig)
