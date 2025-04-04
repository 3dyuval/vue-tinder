import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {resolve} from 'path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
    plugins: [
        vue()
    ],
    server: {
        port: 5050
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    build: {
        lib: {
            entry: fileURLToPath(new URL('./src/components/index.js', import.meta.url)),
            name: 'VueTinder',
            fileName: (format) => `vue-tinder.${format === 'es' ? 'mjs' : 'js'}`
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue'
                }
            }
        }
    }
})