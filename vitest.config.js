import {defineConfig, mergeConfig} from 'vitest/config'
import {fileURLToPath} from 'node:url'
import viteConfig from './vite.config'

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            root: fileURLToPath(new URL('./', import.meta.url)),
            globals: true,
            environment: 'jsdom',
            coverage: {
                provider: 'v8',
                reporter: ['text', 'json', 'html']
            },
            include: ['**/*.{test,spec}.{js,ts}']
        }
    })
)