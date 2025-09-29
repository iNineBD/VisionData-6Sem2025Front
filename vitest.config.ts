import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
      '@': resolve(__dirname, './app')
    }
  },
  test: {
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'clover'],
      reportsDirectory: './coverage',
      include: [
        'app/components/**/*',
        'app/layouts/**/*',
        'app/pages/**/*'
      ],
      exclude: [
        'node_modules/**',
        '.output/**',
        '.nuxt/**',
        'dist/**',
        'app/tests/**',
        '**/*.test.{js,ts,vue}',
        '**/*.spec.{js,ts,vue}',
        '**/*.d.ts'
      ],
      all: true
    }
  }
})
