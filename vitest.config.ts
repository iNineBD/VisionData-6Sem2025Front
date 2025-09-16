import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['app/tests/**/*.spec.ts'] // só roda testes dessa pasta
  },
  coverage: {
    include: ['app/components','app/layouts','app/pages'], // só considera cobertura de src/
    exclude: ['app/tests/**'] // não considera cobertura dos testes
  }
})
