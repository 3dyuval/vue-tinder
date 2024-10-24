import { defineConfig, UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'


export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000
  },
  build: {
    minify: true,
    outDir: 'dist',
    emptyOutDir: true
  }
} satisfies UserConfig)