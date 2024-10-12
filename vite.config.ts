import { defineConfig, UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'


export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000
  }
} satisfies UserConfig)