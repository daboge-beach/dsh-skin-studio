/**
 * vitest 配置：单测根目录是包根（test/），不要继承 demo 的 vite root=dev。
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    root: '.',
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
})
